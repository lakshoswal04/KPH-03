"""Seed/reconcile the catalogue: categories, paint + tool products (with pack
size variants), and the colour catalogue. Fully idempotent — safe to re-run;
upserts categories, removes retired ones, adds missing products, refreshes
images and variants. Run: python seed.py"""

from app.core.database import SessionLocal
from app.data.birla_specs import SPECS, build_faqs
from app.models import Category, Colour, Product

CATEGORIES = [
    ("interior-paints", "Interior Paints", "🏠", "Emulsions, distempers, and primers for every interior wall and ceiling.", "#E8590C", "#FFF8EF", "47 products"),
    ("exterior-paints", "Exterior Paints", "🏗️", "Weather-resistant emulsions engineered for Pune's climate.", "#0ABFBC", "#F0FFFE", "23 products"),
    ("waterproofing", "Waterproofing", "💧", "Alldry solutions for damp walls, leaking roofs, and monsoon damage.", "#FF4D6D", "#FFF0F3", "18 products"),
    ("enamels", "Enamels", "🔩", "High-gloss enamels for metal doors, grills, and furniture.", "#7B2FBE", "#F8F5FF", "12 products"),
    ("wood-finishes", "Wood Finishes", "🪵", "Allwood PU, melamine, and stain finishes for all wooden surfaces.", "#F5C518", "#FFFBF0", "14 products"),
    ("tools", "Tools", "🖌️", "Rollers, brushes, sandpaper, solvents, and surface-prep tools.", "#E8590C", "#FFF5F0", "7 products"),
    ("hardware", "Hardware", "🔧", "UPVC, CPVC, and PVC pipes with sockets, tees, elbows, and fittings.", "#2F6FB5", "#EFF6FF", "9 products"),
]

# Categories removed from the catalogue — deleted (with their products) on reseed.
REMOVED_CATEGORY_SLUGS = ["wallpapers", "aerosols"]

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
    # Tools — on-brand catalogue tiles (replace with real product photos later).
    "paint-roller": "/products/tools/paint-roller.svg",
    "paint-brush": "/products/tools/paint-brush.svg",
    "turpentine-oil": "/products/tools/turpentine-oil.svg",
    "thinner": "/products/tools/thinner.svg",
    "sandpaper": "/products/tools/sandpaper.svg",
    "waterpaper": "/products/tools/waterpaper.svg",
    "metal-scraper": "/products/tools/metal-scraper.svg",
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


def compute_variants(product: Product) -> list[dict]:
    """Tools and hardware carry explicit variants; paints get computed pack sizes."""
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

        # Images + variants + tool/hardware sub_brand — refresh on every run.
        SUB_BRAND_BY_TAB = {"tools": "TOOLS", "hardware": "HARDWARE"}
        updated = 0
        for product in db.query(Product).all():
            image_url = IMAGE_MAP.get(product.slug)  # None for tools → labelled placeholder
            if product.image_url != image_url:
                product.image_url = image_url
                updated += 1
            variants = compute_variants(product)
            if product.variants != variants:
                product.variants = variants
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
