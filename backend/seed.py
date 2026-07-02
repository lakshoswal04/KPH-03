"""Seed the catalogue: 8 categories, 16 products, colour catalogue.
Idempotent — skips any table that already has rows. Run: python seed.py"""

from app.core.database import SessionLocal
from app.models import Category, Colour, Product

CATEGORIES = [
    ("interior-paints", "Interior Paints", "🏠", "Emulsions, distempers, and primers for every interior wall and ceiling.", "#E8590C", "#FFF8EF", "47 products"),
    ("exterior-paints", "Exterior Paints", "🏗️", "Weather-resistant emulsions engineered for Pune's climate.", "#0ABFBC", "#F0FFFE", "23 products"),
    ("waterproofing", "Waterproofing", "💧", "Alldry solutions for damp walls, leaking roofs, and monsoon damage.", "#FF4D6D", "#FFF0F3", "18 products"),
    ("enamels", "Enamels", "🔩", "High-gloss enamels for metal doors, grills, and furniture.", "#7B2FBE", "#F8F5FF", "12 products"),
    ("wood-finishes", "Wood Finishes", "🪵", "Allwood PU, melamine, and stain finishes for all wooden surfaces.", "#F5C518", "#FFFBF0", "14 products"),
    ("wallpapers", "Wallpapers", "🖼️", "Designer wallpapers in textured, printed, and geometric patterns.", "#2DD4A0", "#F0FFF8", "32 designs"),
    ("tools", "Tools", "🖌️", "Foam rollers, cloud rollers, brushes, and trays from Birla Opus.", "#E8590C", "#FFF5F0", "8 products"),
    ("aerosols", "Aerosols", "💨", "One Aero premium spray cans for touch-ups and decorative work.", "#9B5FE8", "#F5F0FF", "6 products"),
]

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

# Catalogue shades per family for the /colours page.
CATALOGUE_SHADES = [
    ("Fresh Linen", "#F8F4EC", "Whites"), ("Morning Mist", "#EFEBE2", "Whites"),
    ("Pearl Drop", "#F2EEE6", "Whites"), ("Ivory Silk", "#F6F1E4", "Whites"),
    ("Marigold", "#F0B429", "Yellows"), ("Haldi Glow", "#E8B004", "Yellows"),
    ("Lemon Sorbet", "#F5D76E", "Yellows"), ("Amber Field", "#DDA511", "Yellows"),
    ("Saffron Street", "#E8722C", "Oranges"), ("Clay Pot", "#C96A32", "Oranges"),
    ("Papaya Punch", "#F08A4B", "Oranges"),
    ("Sindoor", "#D63A2F", "Reds"), ("Chilli Crush", "#B8322A", "Reds"),
    ("Rose Madder", "#C94057", "Reds"),
    ("Royal Orchid", "#8A4BC9", "Purples"), ("Jamun Dusk", "#6B2E9E", "Purples"),
    ("Lavender Haze", "#B79BD9", "Purples"),
    ("Indigo Depth", "#2F4DA0", "Blues"), ("Monsoon Sky", "#5B7FBE", "Blues"),
    ("Powder Blue", "#A9C3E0", "Blues"),
    ("Peacock Teal", "#0A9E9B", "Blue-Greens"), ("Lagoon", "#3FBFB4", "Blue-Greens"),
    ("Sea Glass", "#8AD4CC", "Blue-Greens"),
    ("Banana Leaf", "#3FA05C", "Greens"), ("Tulsi", "#5CB878", "Greens"),
    ("Fern Shadow", "#7BA88A", "Greens"),
    ("Lime Zest", "#AFC93A", "Yellow-Greens"), ("Pista Cream", "#C6D68A", "Yellow-Greens"),
    ("Olive Grove", "#8FA02D", "Yellow-Greens"),
    ("Khaki Dune", "#A99878", "Neutrals"), ("Stone Path", "#9B9080", "Neutrals"),
    ("Mocha Mist", "#7C6A5A", "Neutrals"),
    ("Kumkum Red", "#CC4040", "India Iconic"), ("Rangoli Pink", "#D95A6E", "India Iconic"),
    ("Mehendi Green", "#7A8B3A", "India Iconic"), ("Peacock Blue", "#1F6E8C", "India Iconic"),
]

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
}

FAMILY_ORDER = [
    "Whites", "Yellows", "Oranges", "Reds", "Purples", "Blues",
    "Blue-Greens", "Greens", "Yellow-Greens", "Neutrals", "India Iconic",
]


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def main() -> None:
    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            for i, (slug, name, emoji, desc, accent, bg, count_label) in enumerate(CATEGORIES):
                db.add(Category(
                    slug=slug, name=name, emoji=emoji, description=desc,
                    accent=accent, background=bg, count_label=count_label, sort_order=i,
                ))
            db.commit()
            print(f"Seeded {len(CATEGORIES)} categories")
        else:
            print("Categories already seeded — skipping")

        if db.query(Product).count() == 0:
            cat_by_slug = {c.slug: c.id for c in db.query(Category).all()}
            for tab, cat_slug, brand, name, desc, features, low, high, unit in PRODUCTS:
                db.add(Product(
                    slug=slugify(name), name=name, sub_brand=brand, tab=tab,
                    description=desc, features=features, price_low=low, price_high=high,
                    price_unit=unit, category_id=cat_by_slug.get(cat_slug),
                    image_url=None,
                ))
            db.commit()
            print(f"Seeded {len(PRODUCTS)} products")
        else:
            print("Products already seeded — skipping")

        updated = 0
        for product in db.query(Product).all():
            image_url = IMAGE_MAP.get(product.slug)
            if image_url and product.image_url != image_url:
                product.image_url = image_url
                updated += 1
        if updated:
            db.commit()
            print(f"Updated {updated} product images")

        if db.query(Colour).count() == 0:
            order = 0
            for name, hex_, family in EXPLORER_SHADES:
                db.add(Colour(
                    name=name, hex=hex_, family=family,
                    is_explorer_shade=True,
                    sort_order=FAMILY_ORDER.index(family) * 100 + order,
                ))
                order += 1
            for name, hex_, family in CATALOGUE_SHADES:
                db.add(Colour(
                    name=name, hex=hex_, family=family,
                    is_explorer_shade=False,
                    sort_order=FAMILY_ORDER.index(family) * 100 + order,
                ))
                order += 1
            db.commit()
            print(f"Seeded {len(EXPLORER_SHADES) + len(CATALOGUE_SHADES)} colours")
        else:
            print("Colours already seeded — skipping")
    finally:
        db.close()


if __name__ == "__main__":
    main()
