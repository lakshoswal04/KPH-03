"""Seed/reconcile the catalogue: categories, paint + tool products (with pack
size variants), and the colour catalogue. Fully idempotent — safe to re-run;
upserts categories, removes retired ones, adds missing products, refreshes
images and variants. Run: python seed.py"""

import json
from pathlib import Path

from app.core.database import SessionLocal
from app.data.birla_specs import SPECS, build_faqs
from app.models import Category, Colour, Product

CATEGORIES = [
    ("interior-paints", "Interior Paints", "🏠", "Birla Opus emulsions and designer finishes from the One, Calista, and Style ranges for every interior wall and ceiling.", "#E8590C", "#FFF8EF", "22 products"),
    ("exterior-paints", "Exterior Paints", "🏗️", "Weather-resistant emulsions and textures engineered for Pune's climate.", "#0ABFBC", "#F0FFFE", "14 products"),
    ("enamels", "Enamels", "🔩", "Calista Sparkle enamels, varnish, and metal primers plus Style stainers for doors, grills, and furniture.", "#7B2FBE", "#F8F5FF", "9 products"),
    ("waterproofing", "Waterproofing", "💧", "Alldry solutions for damp walls, leaking roofs, and monsoon damage.", "#FF4D6D", "#FFF0F3", "9 products"),
    ("wood-finishes", "Wood Finishes", "🪵", "Allwood PU, melamine, stain, and filler finishes for all wooden surfaces.", "#F5C518", "#FFFBF0", "8 products"),
    ("primers-putty", "Primers & Putty", "🧱", "One Pro, Calista, and Style undercoats — primers and acrylic putty for a smooth, long-lasting base.", "#5B8DB8", "#EFF6FF", "7 products"),
    ("aerosols", "Aerosols", "🎨", "One aerosol spray paints for quick touch-ups, DIY projects, and metal surfaces.", "#2F9E44", "#F0FFF4", "2 products"),
    ("tools", "Tools", "🖌️", "Rollers, brushes, sandpaper, solvents, and surface-prep tools.", "#E8590C", "#FFF5F0", "9 products"),
    ("hardware", "Hardware", "🔧", "UPVC, CPVC, and PVC pipes with sockets, tees, elbows, and fittings.", "#2F6FB5", "#EFF6FF", "9 products"),
]

# Categories removed from the catalogue — deleted (with their products) on reseed.
REMOVED_CATEGORY_SLUGS = ["wallpapers"]

# (tab, category_slug, sub_brand, name, description, features, price_low, price_high, unit)
PRODUCTS = [
    ("interior", "interior-paints", "ONE", "One Pure Elegance",
     "Luxury interior emulsion with scuff-proof technology and anti-bacterial germ protection.",
     ["Scuff-Proof", "Anti-bacterial", "Soft Sheen", "Low VOC"], 320, 480, "L"),
    ("interior", "interior-paints", "CALISTA", "Calista Ever Clear",
     "Premium emulsion with a clean, vibrant look and excellent washability across 8,000 scrub cycles.",
     ["Washable", "High Opacity", "Anti-fungal", "Low Odour"], 220, 320, "L"),
    ("interior", "interior-paints", "CALISTA", "Calista Ever Stay",
     "Smooth, beautiful walls with excellent peel protection and long-lasting premium finish.",
     ["Peel-Resistant", "Smooth Finish", "Stain-Resistant", "Durable"], 200, 300, "L"),
    ("interior", "interior-paints", "STYLE", "Style Color Smart",
     "Economy interior paint with superior coverage — 15% extra coverage per coat versus standard paints.",
     ["Extra Coverage", "Long Lasting", "Value for Money", "Bright Finish"], 120, 180, "L"),
    ("exterior", "exterior-paints", "ONE", "One True Look",
     "16-year warranty exterior emulsion with superior dust and algae resistance for low-maintenance facades.",
     ["16-Year Warranty", "Algae-Resistant", "Crack-Proof", "UV-Stable"], 360, 520, "L"),
    ("exterior", "exterior-paints", "CALISTA", "Calista Neo Star",
     "Premium exterior emulsion that preserves the newly painted look with superior dust resistance.",
     ["Dust-Resistant", "Weather Shield", "Colour Retention", "Long Lasting"], 240, 360, "L"),
    ("exterior", "exterior-paints", "CALISTA", "Calista Neo Star Shine",
     "Premium finish with superior dust resistance and extra gloss shine for a standout exterior.",
     ["High Gloss", "Dust-Resistant", "Monsoon-Ready", "UV-Stable"], 260, 380, "L"),
    ("exterior", "exterior-paints", "STYLE", "Style Power Fit",
     "Economy exterior emulsion with strong weather resistance for cost-effective facade painting.",
     ["Weather Resistant", "Value for Money", "Bright Finish", "Durable"], 140, 200, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Wall Fix 4",
     "Crack-proof waterproofing primer that upgrades your walls before topcoat application.",
     ["Crack-Proof", "Pre-Coat Primer", "Strong Adhesion", "Dampness-Proof"], 180, 260, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Wall n Roof 12",
     "12-year guaranteed waterproofing for walls and roofs — all-round protection from Pune's heavy monsoon.",
     ["12-Year Guarantee", "Roof & Wall", "Monsoon-Ready", "Crack-Resistant"], 320, 440, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Salt Seal",
     "Specialist primer for walls with salt and efflorescence damage — stops white powder deposits permanently.",
     ["Anti-Efflorescence", "Penetrating", "Salt Barrier", "Long Lasting"], 200, 280, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Crack Master Paste",
     "Waterproof crack-filling paste for damaged walls — creates a smooth, crack-free surface before painting.",
     ["Crack Filler", "Waterproof", "Flexible", "Easy Application"], 90, 140, "kg"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood PU Interior",
     "High-performance polyurethane finish for interior wood with long-lasting protection and a premium appearance.",
     ["PU Finish", "Scratch-Resistant", "Non-Yellowing", "Rich Gloss"], 420, 580, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood Italian PU",
     "Ultra-premium Italian PU for a luxury wood finish — the finest wood coating in the Birla Opus range.",
     ["Italian PU", "Ultra-Rich Finish", "Non-Yellowing", "Premium"], 680, 900, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood Melamine",
     "Interior wood melamine polish for a premium finish on furniture and cabinetry.",
     ["Melamine Finish", "Smooth", "Hard-Wearing", "Furniture-Grade"], 340, 460, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood Wood Stain",
     "Translucent stain that enhances natural wood grain while adding a rich tinted colour.",
     ["Translucent", "Grain-Enhancing", "Multiple Shades", "Indoor & Outdoor"], 280, 380, "L"),

    # ---- Full official Birla Opus range (added 2026-07-04, official-only info) ----
    # Interior (One / Calista / Style ranges)
    ("interior", "interior-paints", "CALISTA", "Calista Everwash",
     "Premium interior emulsion for stainproof walls with excellent washability.",
     ["Stainproof", "Washable", "Anti-fungal", "Soft Sheen"], 240, 340, "L"),
    ("interior", "interior-paints", "STYLE", "Style Color Smart Shine",
     "Economy interior emulsion with a soft-sheen finish and excellent washability across 1,800+ shades.",
     ["Soft Sheen", "Washable", "Bright Finish", "Value for Money"], 140, 200, "L"),
    ("interior", "interior-paints", "STYLE", "Style Super Bright",
     "Transform your living space with unparalleled brightness and exceptional coverage.",
     ["High Brightness", "Extra Coverage", "Long Lasting", "Bright Finish"], 130, 190, "L"),
    ("interior", "interior-paints", "STYLE", "Style Colour Fresh",
     "Economy interior paint with 15% higher coverage per coat for a fresh, even finish.",
     ["15% Extra Coverage", "Even Finish", "Value for Money", "Quick Drying"], 110, 170, "L"),

    # Exterior (One / Calista / Style ranges)
    ("exterior", "exterior-paints", "ONE", "One True Life",
     "Luxury exterior emulsion with robust resistance to colour fading, dust, and algae for a long-lasting facade.",
     ["Colour-Fade Resistant", "Dust-Resistant", "Algae-Resistant", "UV-Stable"], 340, 500, "L"),
    ("exterior", "exterior-paints", "STYLE", "Style Power Bright",
     "Economy exterior emulsion with superior dust resistance and extra shine via Nitrogen bond technology.",
     ["Dust-Resistant", "Extra Shine", "Weather Resistant", "Value for Money"], 150, 210, "L"),

    # Enamels (Calista Sparkle range + metal primers)
    ("enamels", "enamels", "CALISTA", "Calista Sparkle Gloss",
     "High-gloss synthetic enamel that gives metal and wood surfaces superior coverage and a rich, long-lasting shine.",
     ["High Gloss", "Rich Finish", "Metal & Wood", "Long-Lasting Shine"], 240, 340, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Sparkle PU",
     "Anti-rust polyurethane enamel for wood, metal, and walls — a smooth glossy finish with superior weather resistance.",
     ["PU Enamel", "Anti-Rust", "Weather-Resistant", "Smooth Gloss"], 320, 460, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Sparkle Red Oxide Primer",
     "Red oxide metal primer that protects ferrous surfaces from rust and improves topcoat adhesion.",
     ["Rust Protection", "Strong Adhesion", "For Metal", "Solvent-Based"], 160, 240, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Sparkle Yellow Metal Primer",
     "Solvent-thinnable yellow metal primer built for superior rust protection and better topcoat bonding on ferrous substrates.",
     ["Rust Protection", "Topcoat Bonding", "For Metal", "Solvent-Thinnable"], 160, 240, "L"),

    # Waterproofing (Alldry range)
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Wall n Roof 10",
     "All-round waterproofing for exterior walls and terraces — reliable protection through Pune's monsoon.",
     ["Wall & Roof", "Monsoon-Ready", "Crack-Resistant", "UV-Stable"], 300, 420, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Total 2K",
     "Two-component cementitious waterproof coating for a tough, seamless membrane on terraces and wet areas.",
     ["2-Component", "Seamless Membrane", "Terraces & Wet Areas", "High Durability"], 360, 520, "kg"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Repair Master",
     "Multipurpose pre-painting repair solution for cracks and surface defects before waterproofing or topcoat.",
     ["Multipurpose Repair", "Crack Fixing", "Pre-Paint Prep", "Strong Bond"], 140, 220, "kg"),

    # Wood finishes (Allwood range)
    ("wood", "wood-finishes", "ALLWOOD", "Allwood PU Exterior",
     "Luxurious polyurethane finish for exterior wooden surfaces with strong weather and UV protection.",
     ["Exterior PU", "Weather-Resistant", "UV-Stable", "Rich Finish"], 480, 640, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood SoftTouch",
     "Interior and exterior wood paint with a smooth soft-touch matt finish.",
     ["Soft-Touch Matt", "Interior & Exterior", "Smooth Finish", "Durable"], 360, 480, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood Melamine Ultra Clear",
     "Non-yellowing ultra-clear melamine finish that showcases natural wood grain on furniture and cabinetry.",
     ["Ultra Clear", "Non-Yellowing", "Grain-Enhancing", "Furniture-Grade"], 360, 480, "L"),
    ("wood", "wood-finishes", "ALLWOOD", "Allwood Wood Filler",
     "Wood filler that plugs dents, holes, and scratches to create a levelled, smooth surface before finishing.",
     ["Fills Dents & Holes", "Levelling", "Sandable", "Pre-Finish Prep"], 120, 200, "kg"),

    # Primers & Putty (One Pro / Style undercoats)
    ("primers", "primers-putty", "ONE PRO", "One Pro Smooth Primer",
     "High-performance interior wall primer that seals the surface and improves topcoat adhesion and coverage.",
     ["Interior Primer", "Seals Surface", "Strong Adhesion", "Better Coverage"], 180, 260, "L"),
    ("primers", "primers-putty", "ONE PRO", "One Pro Smooth Putty",
     "Interior acrylic wall putty for a smooth, even base before priming and painting.",
     ["Acrylic Putty", "Smooth Base", "Interior", "Water-Resistant"], 40, 60, "kg"),
    ("primers", "primers-putty", "ONE PRO", "One Pro Putty+Primer",
     "Combined putty and primer that levels and seals interior walls in fewer steps.",
     ["Putty + Primer", "Fewer Coats", "Smooth Base", "Interior"], 60, 90, "kg"),
    ("primers", "primers-putty", "STYLE", "Style Perfect Start Primer",
     "Opaque exterior wall primer that provides a strong, uniform base for exterior emulsions.",
     ["Exterior Primer", "Opaque Base", "Strong Adhesion", "Weather-Ready"], 140, 220, "L"),

    # ---- Dealer price-list range (added 2026-07-16). Pack prices for these
    # come from CD_LANDING_VARIANTS (actual CD Landing rates), not the
    # computed paint_variants() formula. price_low/price_high here are the
    # derived per-unit range and are kept in sync on every reseed. ----
    # Interior (One luxury + designer finishes, Calista, Style)
    ("interior", "interior-paints", "ONE", "One Pure Elegance Soft",
     "Luxury interior emulsion with a soft-sheen finish, scuff-proof technology and anti-bacterial protection.",
     ["Soft Sheen", "Scuff-Proof", "Anti-bacterial", "Luxury Finish"], 533, 550, "L"),
    ("interior", "interior-paints", "ONE", "One Pure Elegance Shine",
     "Luxury interior emulsion with a high-sheen finish that adds a radiant glow to living spaces.",
     ["High Sheen", "Scuff-Proof", "Anti-bacterial", "Radiant Glow"], 568, 583, "L"),
    ("interior", "interior-paints", "ONE", "One Pure Elegance Matt",
     "Luxury interior emulsion with an elegant matt finish that hides surface undulations beautifully.",
     ["Elegant Matt", "Scuff-Proof", "Anti-bacterial", "Rich Colours"], 575, 591, "L"),
    ("interior", "interior-paints", "ONE", "One Dream Effects",
     "Special-effects designer finish for stunning feature walls with unique textures and patterns.",
     ["Designer Finish", "Feature Walls", "Special Effects", "Unique Textures"], 790, 863, "L"),
    ("interior", "interior-paints", "ONE", "One Dream Effects Metallic",
     "Metallic designer finish in gold and silver shades for glamorous accent walls.",
     ["Metallic Finish", "Gold & Silver", "Accent Walls", "Designer Range"], 1156, 1260, "L"),
    ("interior", "interior-paints", "ONE", "One Dream Marble",
     "Stucco marble finish that recreates the classic look of polished Italian marble on interior walls.",
     ["Marble Effect", "Stucco Finish", "Premium Look", "Feature Walls"], 567, 567, "L"),
    ("interior", "interior-paints", "ONE", "One Dream Texture",
     "Coarse designer texture finish for bold, dimensional feature walls.",
     ["Textured Finish", "Dimensional", "Feature Walls", "Hides Imperfections"], 136, 146, "L"),
    ("interior", "interior-paints", "ONE", "One Dream Duracoat",
     "Clear protective coat that guards designer wall finishes against stains and daily wear.",
     ["Clear Protection", "Stain Guard", "For Designer Walls", "Long-Lasting"], 898, 898, "L"),
    ("interior", "interior-paints", "ONE", "One Timeless Stone",
     "Architectural concrete finish for a contemporary raw-stone look on feature walls.",
     ["Concrete Look", "Architectural", "Contemporary", "Feature Walls"], 468, 502, "L"),
    ("interior", "interior-paints", "ONE", "One Timeless Clay",
     "Earthy clay finish with natural mineral texture for rustic, old-world walls.",
     ["Clay Finish", "Natural Texture", "Earthy Tones", "Old-World Charm"], 487, 492, "L"),
    ("interior", "interior-paints", "ONE", "One Timeless Natura",
     "Premium natural finish inspired by raw earth minerals for serene, organic interiors.",
     ["Natural Finish", "Mineral Texture", "Organic Look", "Premium"], 843, 890, "L"),
    ("interior", "interior-paints", "CALISTA", "Calista Ever Wash Shine",
     "Premium interior emulsion with advanced shine and excellent washability for bright, easy-clean walls.",
     ["High Shine", "Washable", "Stain-Resistant", "Premium Finish"], 341, 368, "L"),
    ("interior", "interior-paints", "CALISTA", "Calista Ever Clear Matte",
     "Premium interior emulsion with a smooth matte finish and excellent washability.",
     ["Matte Finish", "Washable", "High Opacity", "Low Odour"], 320, 344, "L"),
    ("interior", "interior-paints", "CALISTA", "Calista Lustre Finish",
     "Interior wall paint with a classic lustre finish — a gentle sheen that wipes clean easily.",
     ["Lustre Sheen", "Wipeable", "Classic Finish", "Durable"], 276, 293, "L"),

    # Exterior (One luxury + textures, Calista specialty, Style)
    ("exterior", "exterior-paints", "ONE", "One True Flex",
     "Flexible luxury exterior emulsion that stretches to bridge hairline cracks and seal out rain.",
     ["Crack-Bridging", "Flexible Film", "Rain-Proof", "Luxury Exterior"], 454, 480, "L"),
    ("exterior", "exterior-paints", "ONE", "One True Vision",
     "Top-of-the-line exterior emulsion with maximum durability and long-life colour protection.",
     ["Maximum Durability", "Colour-Lock", "Algae-Resistant", "UV-Stable"], 567, 661, "L"),
    ("exterior", "exterior-paints", "ONE", "One Inspire Clear Coat",
     "Clear matt protective coat for exteriors — shields natural brick, stone, and paint from weather.",
     ["Clear Matt", "Weather Shield", "Brick & Stone", "UV Protection"], 330, 343, "L"),
    ("exterior", "exterior-paints", "ONE", "One Explore 15 Texture",
     "Coarse exterior wall texture for durable, dimensional facade finishes.",
     ["Exterior Texture", "Hides Undulations", "Durable", "Facade Finish"], 42, 42, "kg"),
    ("exterior", "exterior-paints", "ONE", "One Explore Roller Texture",
     "Fine roller-applied exterior texture for even, decorative facade finishes.",
     ["Roller Texture", "Fine Finish", "Decorative", "Weather-Resistant"], 75, 75, "kg"),
    ("exterior", "exterior-paints", "CALISTA", "Calista Neo Floor Shade",
     "Tough floor paint for cement floors, walkways, and parking areas with strong abrasion resistance.",
     ["For Floors", "Abrasion-Resistant", "Weather-Proof", "Easy to Clean"], 418, 426, "L"),
    ("exterior", "exterior-paints", "CALISTA", "Calista Neo Tile Shade",
     "Clear protective coating for roof tiles that restores shine and guards against weathering.",
     ["For Roof Tiles", "Clear Protection", "Weather-Proof", "Restores Shine"], 283, 293, "L"),
    ("exterior", "exterior-paints", "STYLE", "Style Power Bright Shine",
     "Economy exterior emulsion with extra sheen and dependable weather resistance.",
     ["Extra Sheen", "Weather Resistant", "Value for Money", "Bright Finish"], 180, 204, "L"),

    # Primers & Putty (Calista undercoats)
    ("primers", "primers-putty", "CALISTA", "Calista Pro White Primer",
     "Water-based interior wall primer with high whiteness for better topcoat colour and coverage.",
     ["Interior Primer", "High Whiteness", "Better Coverage", "Water-Based"], 152, 176, "L"),
    ("primers", "primers-putty", "CALISTA", "Calista Perfect Choice Primer",
     "Exterior wall primer that seals and binds surfaces for stronger, longer-lasting topcoats.",
     ["Exterior Primer", "Seals Surface", "Strong Binding", "Weather-Ready"], 168, 185, "L"),
    ("primers", "primers-putty", "CALISTA", "Calista Pro White Cement ST Primer",
     "Solvent-thinnable white cement primer for interior walls with excellent sealing on porous surfaces.",
     ["Solvent-Thinnable", "White Cement Base", "Seals Porous Walls", "Interior"], 212, 235, "L"),

    # Waterproofing (Alldry)
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Total Win",
     "Interior waterproofing coating that stops dampness on inside walls and ceilings.",
     ["Interior Dampness", "Wall & Ceiling", "Paintable", "Anti-fungal"], 167, 214, "L"),
    ("waterproofing", "waterproofing", "ALLDRY", "Alldry Total Stop",
     "Instant leak-stop waterproofing for active seepage spots and joints.",
     ["Stops Leaks", "Instant Action", "Joints & Cracks", "Monsoon-Ready"], 452, 485, "L"),

    # Enamels & specialty (Calista Sparkle range, Style stainers)
    ("enamels", "enamels", "CALISTA", "Calista Sparkle Satin Enamel",
     "Premium satin-finish enamel for a smooth, silky sheen on metal and wood.",
     ["Satin Finish", "Silky Sheen", "Metal & Wood", "Premium"], 301, 344, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Sparkle Wood Primer",
     "Wood primer that seals grain and gives a smooth base for enamel and PU topcoats — white and pink bases.",
     ["Seals Wood Grain", "Smooth Base", "White & Pink", "Strong Adhesion"], 212, 252, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Clear Synthetic Varnish",
     "Clear synthetic varnish that protects wood with a tough, glossy transparent film.",
     ["Clear Gloss", "Tough Film", "For Wood", "Enhances Grain"], 311, 336, "L"),
    ("enamels", "enamels", "CALISTA", "Calista Aluminium Paint",
     "Metallic silver aluminium paint for gates, grills, pipes, and machinery — heat and rust resistant.",
     ["Metallic Silver", "Rust-Resistant", "Heat-Tolerant", "Metal Surfaces"], 382, 455, "L"),
    ("enamels", "enamels", "STYLE", "Style Stainer",
     "Universal stainer for tinting paints and enamels. Group A shades: Burnt Sienna, Fire Red, Magenta, "
     "Fast Red, Red Oxide, Yellow Oxide. Group B shades: Fast Yellow Green, Turkey Umber, Black, Fast Blue, "
     "Fast Green, Fast Violet, Fast Yellow.",
     ["Universal Tinter", "13 Shades", "For All Paints", "Deep Colours"], 565, 760, "L"),

    # Aerosols (One spray paints)
    ("aerosols", "aerosols", "ONE", "One Aerosol Solid",
     "Quick-dry aerosol spray paint in solid colours for touch-ups, DIY, and metal surfaces. 400 ml can.",
     ["Quick-Dry", "Solid Colours", "DIY-Friendly", "400 ml Can"], 167, 167, "unit"),
    ("aerosols", "aerosols", "ONE", "One Aerosol Metallic",
     "Quick-dry aerosol spray paint in metallic shades for accents, crafts, and metal surfaces. 400 ml can.",
     ["Quick-Dry", "Metallic Shades", "DIY-Friendly", "400 ml Can"], 198, 198, "unit"),
]

# Hardware/tools products. Each carries explicit size variants (label, price ₹).
# (name, description, features, variants)
TOOL_PRODUCTS = [
    ("Paint Roller",
     "Foam and knit rollers for smooth, fast coverage on interior and exterior walls.",
     ["Smooth Finish", "Reusable", "Low-Splatter", "Fast Coverage"],
     [("2 inch", 60), ("4 inch", 90), ("6 inch", 130), ("8 inch", 170)]),
    ("Paint Brush",
     "Soft-bristle brushes for cutting-in, edges, trims, and detailed enamel work.",
     ["Soft Bristle", "No Shedding", "Fine Edges", "Durable"],
     [("1 inch", 40), ("2 inch", 70), ("3 inch", 110), ("4 inch", 150)]),
    ("Turpentine Oil",
     "Mineral turpentine to thin oil-based enamels and wood finishes — improves flow and speeds drying. Use in well-ventilated areas.",
     ["Thins Enamels", "Improves Flow", "Brush Cleaner", "Oil-Based Only"],
     [("500 ml", 90), ("1 litre", 160)]),
    ("Thinner",
     "General-purpose solvent thinner for enamels and PU, and for cleaning brushes, rollers, and spray equipment.",
     ["All-Purpose", "Fast-Drying", "Equipment Cleaner", "Solvent-Based"],
     [("500 ml", 80), ("1 litre", 150)]),
    ("Sandpaper",
     "Dry sanding sheets for smoothing putty, wood, and old paint before the topcoat — higher number is finer.",
     ["Dry Sanding", "Wood & Wall", "Assorted Grit", "Long-Lasting"],
     [("120 grit", 15), ("150 grit", 15), ("220 grit", 20)]),
    ("Waterpaper",
     "Waterproof wet-sanding sheets for an ultra-smooth finish between coats on enamels and wood.",
     ["Wet Sanding", "Waterproof", "Ultra-Smooth", "Between Coats"],
     [("120 grit", 20), ("150 grit", 25)]),
    ("Metal Scraper",
     "Flat metal scraper / putty blade for removing old paint and applying filler during surface prep.",
     ["Surface Prep", "Rust-Resistant", "Firm Blade", "Comfort Grip"],
     [("2 inch", 70), ("3 inch", 90), ("4 inch", 110), ("6 inch", 150), ("8 inch", 190)]),
    ("Interior Foam Roller",
     "Birla Opus interior foam roller for a beautiful, smooth finish every time on emulsion-painted walls.",
     ["Smooth Finish", "Low-Splatter", "Foam Sleeve", "Fast Coverage"],
     [("4 inch", 110), ("7 inch", 160), ("9 inch", 200)]),
    ("Cloud Finish Roller",
     "Designer finish roller that creates a soft cloud-textured effect for feature walls.",
     ["Designer Finish", "Cloud Texture", "Feature Walls", "Reusable"],
     [("7 inch", 240), ("9 inch", 300)]),
]

# Plumbing hardware products — UPVC/CPVC/PVC pipes and fittings, sized by
# nominal diameter. Same shape as TOOL_PRODUCTS: (name, description, features, variants).
HARDWARE_PRODUCTS = [
    ("CPVC Pipe",
     "CPVC pipe for hot and cold potable water plumbing — handles high temperatures and pressure. Sold per 3-metre length.",
     ["Hot & Cold Water", "High Pressure", "Corrosion-Free", "3m Length"],
     [("1/2 inch", 120), ("3/4 inch", 170), ("1 inch", 240)]),
    ("UPVC Pipe",
     "UPVC pipe for cold water supply and drainage lines — tough, leak-proof, and rust-free. Sold per 3-metre length.",
     ["Cold Water", "Leak-Proof", "Rust-Free", "3m Length"],
     [("3/4 inch", 90), ("1 inch", 130), ("1.5 inch", 210), ("2 inch", 320)]),
    ("PVC Pipe",
     "PVC pipe for drainage, waste, and agricultural water lines — lightweight and easy to install. Sold per 3-metre length.",
     ["Drainage & Agri", "Lightweight", "Durable", "3m Length"],
     [("1 inch", 70), ("1.5 inch", 110), ("2 inch", 180), ("3 inch", 300)]),
    ("Pipe Elbow",
     "90-degree elbow fitting to turn a pipe run around corners. Solvent-weld socket ends for a tight, leak-free joint.",
     ["Changes Direction", "90 Degree", "Solvent-Weld", "Leak-Free"],
     [("1/2 inch", 10), ("3/4 inch", 15), ("1 inch", 25), ("1.5 inch", 45), ("2 inch", 70)]),
    ("Pipe Tee",
     "Tee fitting to branch one pipe line into two — distributes water to multiple outlets.",
     ["Branch Connection", "Three-Way", "Solvent-Weld", "Leak-Free"],
     [("1/2 inch", 12), ("3/4 inch", 18), ("1 inch", 30), ("1.5 inch", 55), ("2 inch", 85)]),
    ("Pipe Coupler",
     "Coupler (socket) to join two pipes of the same diameter and extend a run.",
     ["Joins Pipes", "Same Diameter", "Solvent-Weld", "Leak-Free"],
     [("1/2 inch", 8), ("3/4 inch", 12), ("1 inch", 20), ("1.5 inch", 38), ("2 inch", 60)]),
    ("End Cap",
     "End cap to seal the end of a pipe and stop flow — prevents leaks and keeps lines clean.",
     ["Seals Pipe End", "Stops Flow", "Solvent-Weld", "Watertight"],
     [("1/2 inch", 6), ("3/4 inch", 9), ("1 inch", 14), ("1.5 inch", 28), ("2 inch", 45)]),
    ("Ball Valve",
     "Quarter-turn ball valve to shut off or control water flow in a line — smooth handle operation.",
     ["Shut-Off Control", "Quarter-Turn", "Full Bore", "Durable Handle"],
     [("1/2 inch", 90), ("3/4 inch", 130), ("1 inch", 190)]),
    ("Solvent Cement",
     "Solvent cement adhesive for permanent, watertight solvent-weld joints on UPVC/CPVC/PVC pipes and fittings.",
     ["Watertight Joints", "Fast-Setting", "Strong Bond", "For All PVC"],
     [("50 ml", 40), ("100 ml", 70), ("250 ml", 150)]),
]

# The 14 hero/explorer shades from the PRD (is_explorer_shade=True), in spec order.
EXPLORER_SHADES = [
    ("Off White", "#F5F0E8", "Whites"),
    ("Warm Sand", "#E8C4A0", "Neutrals"),
    ("Terracotta", "#D4956A", "Oranges"),
    ("Rust Red", "#C4513A", "Reds"),
    ("Kamlesh Orange", "#E8590C", "Oranges"),
    ("Sunflower", "#F5C518", "Yellows"),
    ("Sage Garden", "#A8C8A0", "Greens"),
    ("Ocean Teal", "#0ABFBC", "Blue-Greens"),
    ("Steel Blue", "#5B8DB8", "Blues"),
    ("Deep Violet", "#7B2FBE", "Purples"),
    ("Dusty Rose", "#D4537E", "Reds"),
    ("Warm Walnut", "#8B6555", "Neutrals"),
    ("Slate", "#4A4A5A", "Neutrals"),
    ("Midnight", "#1A1A2E", "Blues"),
]

# The full /colours catalogue (2,322 real Birla Opus shades) is loaded from
# app/data/birla_colours.json, generated by scripts/parse_colours.py from the
# official ".skm" colour library. See seed_colours().
COLOURS_JSON = Path(__file__).resolve().parent / "app" / "data" / "birla_colours.json"

# Official Birla Opus packshots, downloaded into frontend/public/products/.
# Applied even when products already exist, so re-running seed refreshes images.
IMAGE_MAP = {
    "one-pure-elegance": "/products/one-pure-elegance.png",
    "calista-ever-clear": "/products/calista-ever-clear.png",
    "calista-ever-stay": "/products/calista-ever-stay.png",
    "style-color-smart": "/products/style-color-smart.png",
    "one-true-look": "/products/one-true-look.png",
    "calista-neo-star": "/products/calista-neo-star.png",
    "calista-neo-star-shine": "/products/calista-neo-star-shine.png",
    "style-power-fit": "/products/style-power-fit.png",
    "alldry-wall-fix-4": "/products/alldry-wall-fix-4.png",
    "alldry-wall-n-roof-12": "/products/alldry-wall-n-roof-12.png",
    "alldry-salt-seal": "/products/alldry-salt-seal.png",
    "alldry-crack-master-paste": "/products/alldry-crack-master-paste.png",
    "allwood-pu-interior": "/products/allwood-pu-interior.png",
    "allwood-italian-pu": "/products/allwood-italian-pu.png",
    "allwood-melamine": "/products/allwood-melamine.png",
    "allwood-wood-stain": "/products/allwood-wood-stain.png",
    # Full-range products (2026-07-04) — official Scene7 packshots, downloaded
    # via assets.birlaopus.com ?$grasim-png-transparent$&wid=800.
    "calista-everwash": "/products/calista-everwash.png",
    "style-color-smart-shine": "/products/style-color-smart-shine.png",
    "style-super-bright": "/products/style-super-bright.png",
    "style-colour-fresh": "/products/style-colour-fresh.png",
    "one-true-life": "/products/one-true-life.png",
    "style-power-bright": "/products/style-power-bright.png",
    "calista-sparkle-gloss": "/products/calista-sparkle-gloss.png",
    "calista-sparkle-pu": "/products/calista-sparkle-pu.png",
    "calista-sparkle-red-oxide-primer": "/products/calista-sparkle-red-oxide-primer.png",
    "calista-sparkle-yellow-metal-primer": "/products/calista-sparkle-yellow-metal-primer.png",
    "alldry-wall-n-roof-10": "/products/alldry-wall-n-roof-10.png",
    "alldry-total-2k": "/products/alldry-total-2k.png",
    "alldry-repair-master": "/products/alldry-repair-master.png",
    "allwood-pu-exterior": "/products/allwood-pu-exterior.png",
    "allwood-softtouch": "/products/allwood-softtouch.png",
    "allwood-melamine-ultra-clear": "/products/allwood-melamine-ultra-clear.png",
    "allwood-wood-filler": "/products/allwood-wood-filler.png",
    # Dealer price-list range (2026-07-16) — official birlaopus.com packshots,
    # served as webp by the Scene7 CDN. 8 trade-only products have no official
    # page/packshot and keep the labelled placeholder: calista-ever-clear-matte,
    # calista-lustre-finish, one-explore-15/roller-texture, calista-sparkle-wood-
    # primer, calista-clear-synthetic-varnish, calista-aluminium-paint, style-stainer.
    "one-pure-elegance-soft": "/products/one-pure-elegance-soft.webp",
    "one-pure-elegance-shine": "/products/one-pure-elegance-shine.webp",
    "one-pure-elegance-matt": "/products/one-pure-elegance-matt.webp",
    "one-dream-effects": "/products/one-dream-effects.webp",
    "one-dream-effects-metallic": "/products/one-dream-effects-metallic.webp",
    "one-dream-marble": "/products/one-dream-marble.webp",
    "one-dream-texture": "/products/one-dream-texture.webp",
    "one-dream-duracoat": "/products/one-dream-duracoat.webp",
    "one-timeless-stone": "/products/one-timeless-stone.webp",
    "one-timeless-clay": "/products/one-timeless-clay.webp",
    "one-timeless-natura": "/products/one-timeless-natura.webp",
    "calista-ever-wash-shine": "/products/calista-ever-wash-shine.webp",
    "one-true-flex": "/products/one-true-flex.webp",
    "one-true-vision": "/products/one-true-vision.webp",
    "one-inspire-clear-coat": "/products/one-inspire-clear-coat.webp",
    "calista-neo-floor-shade": "/products/calista-neo-floor-shade.webp",
    "calista-neo-tile-shade": "/products/calista-neo-tile-shade.webp",
    "style-power-bright-shine": "/products/style-power-bright-shine.webp",
    "calista-pro-white-primer": "/products/calista-pro-white-primer.webp",
    "calista-perfect-choice-primer": "/products/calista-perfect-choice-primer.webp",
    "calista-pro-white-cement-st-primer": "/products/calista-pro-white-cement-st-primer.webp",
    "alldry-total-win": "/products/alldry-total-win.webp",
    "alldry-total-stop": "/products/alldry-total-stop.webp",
    "calista-sparkle-satin-enamel": "/products/calista-sparkle-satin-enamel.webp",
    "one-aerosol-solid": "/products/one-aerosol-solid.webp",
    "one-aerosol-metallic": "/products/one-aerosol-metallic.webp",
    # File name avoids the slug's "+" (URL-unsafe).
    "one-pro-putty+primer": "/products/one-pro-putty-primer.png",
    "one-pro-smooth-primer": "/products/one-pro-smooth-primer.png",
    "one-pro-smooth-putty": "/products/one-pro-smooth-putty.png",
    "style-perfect-start-primer": "/products/style-perfect-start-primer.png",
    # Tools — on-brand catalogue tiles (replace with real product photos later).
    "paint-roller": "/products/tools/paint-roller.svg",
    "paint-brush": "/products/tools/paint-brush.svg",
    "turpentine-oil": "/products/tools/turpentine-oil.svg",
    "thinner": "/products/tools/thinner.svg",
    "sandpaper": "/products/tools/sandpaper.svg",
    "waterpaper": "/products/tools/waterpaper.svg",
    "metal-scraper": "/products/tools/metal-scraper.svg",
    # Official Birla Opus tools — real packshots.
    "interior-foam-roller": "/products/tools/interior-foam-roller.png",
    "cloud-finish-roller": "/products/tools/cloud-finish-roller.png",
    # Hardware — on-brand catalogue tiles.
    "cpvc-pipe": "/products/hardware/cpvc-pipe.svg",
    "upvc-pipe": "/products/hardware/upvc-pipe.svg",
    "pvc-pipe": "/products/hardware/pvc-pipe.svg",
    "pipe-elbow": "/products/hardware/pipe-elbow.svg",
    "pipe-tee": "/products/hardware/pipe-tee.svg",
    "pipe-coupler": "/products/hardware/pipe-coupler.svg",
    "end-cap": "/products/hardware/end-cap.svg",
    "ball-valve": "/products/hardware/ball-valve.svg",
    "solvent-cement": "/products/hardware/solvent-cement.svg",
}

FAMILY_ORDER = [
    "Whites", "Yellows", "Oranges", "Reds", "Purples", "Blues",
    "Blue-Greens", "Greens", "Yellow-Greens", "Neutrals", "India Iconic",
]


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


# Bulk discount factors by pack size — bigger packs cost slightly less per unit.
def paint_variants(price_low: int, unit: str) -> list[dict]:
    packs = [(1, 1.0), (4, 0.97), (10, 0.94), (20, 0.90)] if unit == "L" else [(1, 1.0), (5, 0.96), (20, 0.90)]
    out = []
    for qty, factor in packs:
        price = round(price_low * qty * factor / 10) * 10
        out.append({"label": f"{qty} {unit}", "price": price})
    return out


# Slug → explicit size variants, for tools and hardware (paints are computed).
EXPLICIT_VARIANTS = {
    slugify(name): [{"label": label, "price": price} for label, price in variants]
    for name, _desc, _features, variants in TOOL_PRODUCTS + HARDWARE_PRODUCTS
}

# Slug → actual CD Landing pack prices from the dealer price list (2026-07-16).
# These override the computed paint_variants() formula. Labels: "(10P)" marks
# 10-piece bundle packs; colour-base groups (White/Dark/Light shades etc.)
# carry different rates and become separate variants.
CD_LANDING_VARIANTS: dict[str, list[tuple[str, int]]] = {
    # ---- Interior ----
    "one-pure-elegance": [("1 L", 550), ("4 L", 2168), ("10 L", 5376), ("20 L", 10662)],
    "one-pure-elegance-soft": [("1 L", 550), ("4 L", 2168), ("10 L", 5376), ("20 L", 10662)],
    "one-pure-elegance-shine": [("1 L", 583), ("4 L", 2302), ("10 L", 5723), ("20 L", 11352)],
    "one-pure-elegance-matt": [("1 L", 591), ("4 L", 2332), ("10 L", 5798), ("20 L", 11501)],
    "one-dream-effects": [("200 ml", 158), ("900 ml", 777)],
    "one-dream-effects-metallic": [
        ("200 ml (Gold)", 252), ("1 L (Gold)", 1156),
        ("200 ml (Silver)", 252), ("1 L (Silver)", 1156),
    ],
    "one-dream-marble": [("1 L", 567), ("5 L", 2833)],
    "one-dream-texture": [("5 L", 729), ("20 L", 2721)],
    "one-dream-duracoat": [("1 L", 898)],
    "one-timeless-stone": [("1 L", 502), ("10 L", 4681)],
    "one-timeless-clay": [("1 L", 492), ("10 L", 4866)],
    "one-timeless-natura": [("1 L", 890), ("4 L", 3373)],
    "calista-ever-stay": [("1 L", 273), ("4 L", 1055), ("10 L", 2555), ("20 L", 4966)],
    "calista-everwash": [("1 L", 321), ("4 L", 1252), ("10 L", 3075), ("20 L", 6007)],
    "calista-ever-wash-shine": [("1 L", 368), ("4 L", 1439), ("10 L", 3457), ("20 L", 6827)],
    "calista-ever-clear-matte": [("1 L", 344), ("4 L", 1365), ("10 L", 3302), ("20 L", 6391)],
    "calista-ever-clear": [
        ("1 L", 371), ("4 L", 1473), ("4 L (10P)", 1535), ("10 L", 3556), ("20 L", 6906),
    ],
    "calista-lustre-finish": [("1 L", 293), ("4 L", 1144), ("10 L", 2821), ("20 L", 5513)],
    # ---- Exterior ----
    "one-true-flex": [("1 L", 480), ("4 L", 1891), ("10 L", 4641), ("20 L", 9085)],
    "one-true-vision": [("1 L", 661), ("4 L", 2479), ("10 L", 6233), ("20 L", 11335)],
    "one-true-life": [("1 L", 554), ("4 L", 2078), ("10 L", 4827), ("20 L", 9613)],
    "one-true-look": [
        ("1 L", 474), ("4 L", 1871), ("4 L (10P)", 2033), ("10 L", 4589), ("20 L", 8982),
    ],
    "one-inspire-clear-coat": [("1 L", 343), ("4 L", 1319)],
    "one-explore-15-texture": [("25 kg", 1038)],
    "one-explore-roller-texture": [("25 kg", 1879)],
    "calista-neo-star": [("1 L", 323), ("4 L", 1252), ("10 L", 3024), ("20 L", 5853)],
    "calista-neo-star-shine": [("1 L", 324), ("4 L", 1256), ("10 L", 3035), ("20 L", 5875)],
    "calista-neo-floor-shade": [("1 L", 426), ("4 L", 1673)],
    "calista-neo-tile-shade": [("1 L", 293), ("4 L", 1185), ("10 L", 2838), ("20 L", 5666)],
    "style-power-bright": [("1 L", 202), ("4 L", 774), ("10 L", 1866), ("20 L", 3570)],
    "style-power-bright-shine": [("1 L", 204), ("4 L", 782), ("10 L", 1885), ("20 L", 3607)],
    "style-power-fit": [
        ("1 L (White)", 139), ("4 L (White)", 548), ("10 L (White)", 1239), ("20 L (White)", 2231),
        ("1 L (Terracotta)", 164), ("4 L (Terracotta)", 630),
    ],
    # ---- Primers & Putty ----
    "one-pro-smooth-primer": [("1 L", 248), ("4 L", 934), ("10 L", 2216), ("20 L", 4197)],
    "one-pro-smooth-putty": [("1 kg", 81), ("5 kg", 332), ("10 kg", 725), ("20 kg", 1373)],
    "one-pro-putty+primer": [("1 kg", 78), ("5 kg (10P)", 393), ("10 kg", 705), ("20 kg", 1345)],
    "style-perfect-start-primer": [("1 L", 122), ("4 L", 476), ("10 L", 1115), ("20 L", 2132)],
    "calista-pro-white-primer": [("1 L", 176), ("4 L", 661), ("10 L", 1579), ("20 L", 3030)],
    "calista-perfect-choice-primer": [("1 L", 185), ("4 L", 716), ("10 L", 1725), ("20 L", 3366)],
    "calista-pro-white-cement-st-primer": [("1 L", 235), ("4 L", 902), ("10 L", 2181), ("20 L", 4232)],
    # ---- Waterproofing ----
    "alldry-wall-n-roof-12": [("1 L", 313), ("4 L", 1193), ("10 L", 2907), ("20 L", 5614)],
    "alldry-wall-n-roof-10": [("1 L", 293), ("4 L", 1114), ("10 L", 2699), ("20 L", 5271)],
    "alldry-total-win": [("1 L", 214), ("4 L", 768), ("10 L", 1810), ("20 L", 3349)],
    "alldry-total-stop": [("1 L", 485), ("4 L", 1808)],
    "alldry-wall-fix-4": [
        ("1 L", 232), ("4 L", 834), ("4 L (10P)", 877), ("10 L", 1940), ("20 L", 3771),
    ],
    "alldry-salt-seal": [("1 L", 223), ("4 L", 853), ("20 L", 4068)],
    "alldry-total-2k": [("3 kg", 432), ("15 kg", 1814)],
    "alldry-crack-master-paste": [("500 g", 200), ("1 kg", 351), ("5 kg", 1671)],
    "alldry-repair-master": [("1 kg", 258), ("5 kg", 1138), ("10 kg", 2297), ("20 kg", 4373)],
    # ---- Enamels & specialty ----
    "calista-sparkle-gloss": [
        ("500 ml (White)", 153), ("1 L (White)", 295), ("4 L (White)", 1134),
        ("10 L (White)", 2596), ("20 L (White)", 5061),
        ("500 ml (Dark shades)", 141), ("1 L (Dark shades)", 272), ("4 L (Dark shades)", 1057),
        ("10 L (Dark shades)", 2448), ("20 L (Dark shades)", 4786),
        ("500 ml (Light shades)", 154), ("1 L (Light shades)", 298), ("4 L (Light shades)", 1159),
        ("10 L (Light shades)", 2694), ("20 L (Light shades)", 5290),
    ],
    "calista-sparkle-satin-enamel": [
        ("500 ml", 172), ("1 L", 333), ("4 L", 1295), ("10 L", 3062), ("20 L", 6027),
    ],
    "calista-sparkle-pu": [
        ("500 ml (White)", 163), ("1 L (White)", 309), ("4 L (White)", 1191),
        ("500 ml (Dark shades)", 157), ("1 L (Dark shades)", 286), ("4 L (Dark shades)", 1114),
        ("500 ml (Light shades)", 165), ("1 L (Light shades)", 315), ("4 L (Light shades)", 1229),
    ],
    "calista-sparkle-wood-primer": [
        ("500 ml (White)", 126), ("1 L (White)", 233), ("4 L (White)", 899),
        ("1 L (Pink)", 224), ("4 L (Pink)", 867), ("10 L (Pink)", 2165), ("20 L (Pink)", 4230),
    ],
    "calista-sparkle-red-oxide-primer": [
        ("500 ml", 118), ("1 L", 225), ("4 L", 867), ("20 L", 4102),
    ],
    "calista-sparkle-yellow-metal-primer": [
        ("500 ml", 132), ("1 L", 250), ("4 L", 973), ("20 L", 4603),
    ],
    "calista-clear-synthetic-varnish": [
        ("500 ml", 168), ("1 L", 328), ("4 L", 1273), ("10 L", 3158), ("20 L", 6219),
    ],
    "calista-aluminium-paint": [
        ("200 ml", 91), ("500 ml", 204), ("1 L", 393), ("4 L", 1529),
    ],
    "style-stainer": [
        ("50 ml (Group A)", 38), ("100 ml (Group A)", 70), ("200 ml (Group A)", 136),
        ("50 ml (Group B)", 33), ("100 ml (Group B)", 58), ("200 ml (Group B)", 113),
    ],
    # ---- Aerosols ----
    "one-aerosol-solid": [("400 ml", 167)],
    "one-aerosol-metallic": [("400 ml", 198)],
}


def _label_qty(label: str) -> float:
    """Pack quantity from a variant label, in base units (L/kg): "500 ml" → 0.5,
    "4 L (10P)" → 4. ml/g convert to L/kg."""
    num, unit = label.split()[:2]
    qty = float(num)
    return qty / 1000 if unit.lower() in ("ml", "g") else qty


def unit_price_range(variants: list[dict], price_unit: str) -> tuple[int, int]:
    """Per-unit (₹/L or ₹/kg) min–max across pack variants; per-pack for "unit"."""
    if price_unit == "unit":
        prices = [v["price"] for v in variants]
        return min(prices), max(prices)
    per_unit = [v["price"] / _label_qty(v["label"]) for v in variants]
    return round(min(per_unit)), round(max(per_unit))


def compute_variants(product: Product) -> list[dict]:
    """CD Landing price-list packs win; tools/hardware carry explicit variants;
    remaining paints (no official rate yet) get computed pack sizes."""
    if product.slug in CD_LANDING_VARIANTS:
        return [{"label": label, "price": price} for label, price in CD_LANDING_VARIANTS[product.slug]]
    if product.slug in EXPLICIT_VARIANTS:
        return EXPLICIT_VARIANTS[product.slug]
    return paint_variants(product.price_low, product.price_unit)


def apply_catalogue_enrichment(db) -> None:
    """Idempotently apply official specs, SKUs, default stock, pack sizes, and
    primer/putty links. Spec values come only from app/data/birla_specs.py
    (official sources); products without an entry keep empty spec fields."""
    products = db.query(Product).all()
    by_name = {p.name.lower(): p for p in products}
    changed = 0
    specced = 0
    for p in products:
        # Working stock + SKU so the store is purchasable (no official value needed).
        if not p.sku:
            p.sku = f"{p.sub_brand[:3].upper()}-{p.id:04d}"
            changed += 1
        if (p.stock or 0) == 0 and (p.reserved or 0) == 0:
            p.stock = 100
            changed += 1
        # Pack sizes default from computed variant labels when not officially set.
        if not p.pack_sizes and p.variants:
            p.pack_sizes = [v["label"] for v in p.variants]
            changed += 1

        spec = SPECS.get(p.slug)
        if not spec:
            continue
        for field in (
            "summary", "finish", "coverage", "drying_time", "coats",
            "application_method", "interior_exterior",
        ):
            if spec.get(field) and getattr(p, field) != spec[field]:
                setattr(p, field, spec[field])
        for field in ("suitable_surfaces", "benefits", "pack_sizes"):
            if spec.get(field):
                setattr(p, field, spec[field])
        tech = dict(spec.get("tech_specs", {}))
        if spec.get("recommended_primer"):
            tech["Recommended primer"] = spec["recommended_primer"]
            primer = by_name.get(spec["recommended_primer"].lower())
            if primer:
                p.recommended_primer_id = primer.id
        if spec.get("recommended_putty"):
            tech["Recommended putty"] = spec["recommended_putty"]
            putty = by_name.get(spec["recommended_putty"].lower())
            if putty:
                p.recommended_putty_id = putty.id
        if tech:
            p.tech_specs = tech
        faqs = build_faqs(spec)
        if faqs:
            p.faqs = faqs
        # SEO metadata derived from official name + summary.
        p.seo_title = f"{p.name} — Birla Opus | Kamlesh Paints"
        p.seo_description = (spec.get("summary") or p.description)[:300]
        specced += 1
    if changed or specced:
        db.commit()
        print(f"Enriched catalogue: {changed} base fields, {specced} products with official specs")


def seed_coupons(db) -> None:
    """Seed a couple of demo coupons (idempotent by code)."""
    from app.models.coupon import Coupon

    demos = [
        {"code": "WELCOME10", "discount_type": "percent", "value": 10,
         "min_order": 500, "max_discount": 300},
        {"code": "PUNE200", "discount_type": "flat", "value": 200, "min_order": 2000},
    ]
    existing = {c.code for c in db.query(Coupon).all()}
    added = 0
    for d in demos:
        if d["code"] not in existing:
            db.add(Coupon(**d))
            added += 1
    if added:
        db.commit()
        print(f"Seeded {added} coupons")


def seed_colours(db) -> None:
    """Seed the colour catalogue: ~14 curated hero/explorer shades plus the full
    2,322-shade official Birla Opus library from birla_colours.json.

    Idempotent: explorer shades upsert by name; catalogue shades upsert by code;
    legacy hand-authored catalogue shades (code IS NULL, not explorer) are removed.
    """
    # Curated hero shades for the homepage explorer strip (no official code).
    existing_explorer = {
        c.name: c for c in db.query(Colour).filter(Colour.is_explorer_shade.is_(True)).all()
    }
    for order, (name, hex_, family) in enumerate(EXPLORER_SHADES):
        c = existing_explorer.get(name)
        sort_order = -1000 + order  # sort ahead of the coded catalogue
        if c is None:
            db.add(Colour(name=name, hex=hex_, family=family,
                          is_explorer_shade=True, sort_order=sort_order))
        else:
            c.hex, c.family, c.sort_order = hex_, family, sort_order

    # Drop the old hand-authored catalogue shades (superseded by the real library).
    db.query(Colour).filter(
        Colour.is_explorer_shade.is_(False), Colour.code.is_(None)
    ).delete(synchronize_session=False)

    # Full official catalogue, upserted by code.
    catalogue = json.loads(COLOURS_JSON.read_text(encoding="utf-8"))
    existing_coded = {
        c.code: c for c in db.query(Colour).filter(Colour.code.isnot(None)).all()
    }
    added = 0
    for row in catalogue:
        c = existing_coded.get(row["code"])
        if c is None:
            db.add(Colour(
                code=row["code"], name=row["name"], hex=row["hex"],
                family=row["family"], is_explorer_shade=False,
                sort_order=row["sort_order"],
            ))
            added += 1
        else:
            c.name, c.hex, c.family, c.sort_order = (
                row["name"], row["hex"], row["family"], row["sort_order"]
            )
    db.commit()
    total = db.query(Colour).count()
    print(f"Colours: {len(EXPLORER_SHADES)} explorer + {len(catalogue)} catalogue "
          f"({added} new) — {total} total")


def main() -> None:
    db = SessionLocal()
    try:
        # Categories — upsert, then drop removed ones (and their products).
        cat_by_slug = {c.slug: c for c in db.query(Category).all()}
        for i, (slug, name, emoji, desc, accent, bg, count_label) in enumerate(CATEGORIES):
            cat = cat_by_slug.get(slug)
            if cat is None:
                db.add(Category(
                    slug=slug, name=name, emoji=emoji, description=desc,
                    accent=accent, background=bg, count_label=count_label, sort_order=i,
                ))
            else:
                cat.name, cat.emoji, cat.description = name, emoji, desc
                cat.accent, cat.background, cat.count_label, cat.sort_order = accent, bg, count_label, i
        db.commit()

        removed = db.query(Category).filter(Category.slug.in_(REMOVED_CATEGORY_SLUGS)).all()
        for cat in removed:
            db.query(Product).filter(Product.category_id == cat.id).delete()
            db.delete(cat)
        if removed:
            db.commit()
            print(f"Removed categories: {[c.slug for c in removed]}")

        cat_by_slug = {c.slug: c.id for c in db.query(Category).all()}

        # Paint/finish products — insert any missing (idempotent by slug).
        existing_slugs = {p.slug for p in db.query(Product).all()}
        added = 0
        for tab, cat_slug, brand, name, desc, features, low, high, unit in PRODUCTS:
            if slugify(name) in existing_slugs:
                continue
            db.add(Product(
                slug=slugify(name), name=name, sub_brand=brand, tab=tab,
                description=desc, features=features, price_low=low, price_high=high,
                price_unit=unit, category_id=cat_by_slug.get(cat_slug), image_url=None,
            ))
            added += 1

        # Tool + hardware products (explicit size variants; sub_brand == display chip).
        for products, sub_brand, tab, cat_slug in (
            (TOOL_PRODUCTS, "TOOLS", "tools", "tools"),
            (HARDWARE_PRODUCTS, "HARDWARE", "hardware", "hardware"),
        ):
            for name, desc, features, variants in products:
                if slugify(name) in existing_slugs:
                    continue
                prices = [p for _, p in variants]
                db.add(Product(
                    slug=slugify(name), name=name, sub_brand=sub_brand, tab=tab,
                    description=desc, features=features,
                    price_low=min(prices), price_high=max(prices),
                    price_unit="unit", category_id=cat_by_slug.get(cat_slug), image_url=None,
                ))
                added += 1
        if added:
            db.commit()
            print(f"Added {added} new products")

        # Images + variants + prices + tool/hardware sub_brand — refresh on every run.
        SUB_BRAND_BY_TAB = {"tools": "TOOLS", "hardware": "HARDWARE"}
        # Latest per-unit price range by slug from the PRODUCTS tuples (fallback
        # for products without CD Landing rates).
        tuple_prices = {slugify(name): (low, high) for _t, _c, _b, name, _d, _f, low, high, _u in PRODUCTS}
        updated = 0
        for product in db.query(Product).all():
            image_url = IMAGE_MAP.get(product.slug)  # None for tools → labelled placeholder
            if product.image_url != image_url:
                product.image_url = image_url
                updated += 1
            variants = compute_variants(product)
            if product.variants != variants:
                product.variants = variants
                # Keep pack-size labels in sync (official SPECS pack_sizes are
                # re-applied afterwards by apply_catalogue_enrichment).
                product.pack_sizes = [v["label"] for v in variants]
                updated += 1
            # Displayed price range follows the CD Landing packs where present,
            # else the authored range in PRODUCTS.
            if product.slug in CD_LANDING_VARIANTS:
                low, high = unit_price_range(variants, product.price_unit)
            else:
                low, high = tuple_prices.get(product.slug, (product.price_low, product.price_high))
            if (product.price_low, product.price_high) != (low, high):
                product.price_low, product.price_high = low, high
                updated += 1
            # Retire the old "KAMLESH" tool brand; keep tools/hardware chips correct.
            wanted_brand = SUB_BRAND_BY_TAB.get(product.tab)
            if wanted_brand and product.sub_brand != wanted_brand:
                product.sub_brand = wanted_brand
                updated += 1
        if updated:
            db.commit()
            print(f"Updated {updated} product image/variant fields")

        apply_catalogue_enrichment(db)
        seed_coupons(db)
        seed_colours(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
