"""Official Birla Opus product specifications.

Every value here is transcribed from the official birlaopus.com product pages
(sources noted per entry). Fields that are NOT explicitly published are omitted
— they must never be invented. Products without an entry keep empty spec fields
until their official data is sourced.

Applied idempotently by `apply_official_specs()` (called from seed.py).
"""

# keyed by product slug -> verified official fields
SPECS: dict[str, dict] = {
    # https://www.birlaopus.com/paint-products/interior-wall-paint/one-pure-elegance
    "one-pure-elegance": {
        "summary": "Premium interior emulsion with a soft-sheen, silky finish and a 9-year performance guarantee.",
        "finish": "Soft Sheen",
        "coverage": "140-160 sq ft/litre/coat",
        "drying_time": "Recoat after 4-6 hours",
        "coats": "2 (after primer)",
        "suitable_surfaces": ["Interior walls", "Ceilings"],
        "interior_exterior": "interior",
        "benefits": [
            "Best-in-class scuff resistance",
            "Superior stain resistance",
            "Anti-bacterial",
            "Low VOC",
            "Low odour",
        ],
        "recommended_primer": "One Pro Smooth Primer",
        "recommended_putty": "One Pro Smooth Putty",
        "tech_specs": {"Warranty": "9 years", "VOC": "Low VOC", "Shelf life": "36 months"},
    },
    # https://www.birlaopus.com/paint-products/interior-wall-paint/calista-ever-clear
    "calista-ever-clear": {
        "summary": "Premium interior emulsion offering 99+ stain resistance and superior washability with a soft sheen.",
        "finish": "Soft sheen with long-lasting shine",
        "coverage": "120-140 sq ft/litre/coat",
        "coats": "2 (after primer)",
        "application_method": "Roller (foam-roller compatible)",
        "suitable_surfaces": ["Interior walls", "Ceilings"],
        "interior_exterior": "interior",
        "pack_sizes": ["1L", "4L", "10L", "20L"],
        "benefits": [
            "99+ stain resistance",
            "Water repellent",
            "Superior washability",
            "Anti-fungal & anti-bacterial",
            "Spatter-resistant",
            "Low VOC",
            "Low odour",
        ],
        "recommended_primer": "Calista Pro White Primer",
        "tech_specs": {"Warranty": "6 years", "VOC": "Low VOC"},
    },
    # https://www.birlaopus.com/paint-products/exterior-wall-paint/one-true-look
    "one-true-look": {
        "summary": "High-performance exterior emulsion with PU technology, heat reflection and a 9-year durability warranty.",
        "coverage": "50-60 sq ft/litre (2 coats)",
        "coats": "2-3",
        "application_method": "Thin 1L with 300-400 ml water; apply 2-3 coats by brush or roller",
        "suitable_surfaces": ["Exterior masonry"],
        "interior_exterior": "exterior",
        "pack_sizes": ["1L", "4L", "10L", "20L"],
        "benefits": [
            "Superior dust & algae resistance",
            "Film integrity against cracking & peeling",
            "UV-resistant pigments reduce fading",
            "Heat-reflective for cooler walls",
            "PU technology for strength",
            "Low VOC",
            "Anti-bacterial",
        ],
        "recommended_primer": "Calista Perfect Choice Primer",
        "recommended_putty": "Alldry Crack Master Paste",
        "tech_specs": {"Warranty": "9 years", "VOC": "Low VOC", "Thinning": "300-400 ml water per litre"},
    },
    # https://www.birlaopus.com/paint-products/exterior-wall-paint/calista-neo-star
    "calista-neo-star": {
        "summary": "Premium exterior emulsion with a soft-sheen finish, strong film integrity and anti-carbonation protection.",
        "finish": "Soft Sheen",
        "coverage": "50-60 sq ft/litre (2 coats)",
        "coats": "2-3",
        "application_method": "Thin 1L with 300-400 ml water; apply by brush or roller",
        "suitable_surfaces": ["Exterior masonry"],
        "interior_exterior": "exterior",
        "pack_sizes": ["1L", "4L", "10L", "20L"],
        "benefits": [
            "Dust resistance",
            "Film integrity",
            "Algae & fungal protection",
            "Low porosity",
            "Anti-carbonation",
            "Low VOC",
        ],
        "recommended_primer": "Calista Perfect Choice Primer",
        "tech_specs": {"Warranty": "6 years", "VOC": "Low VOC", "Thinning": "300-400 ml water per litre"},
    },
}


def build_faqs(spec: dict) -> list[dict]:
    """Generate grounded FAQ pairs strictly from verified spec values."""
    faqs: list[dict] = []
    if spec.get("coverage"):
        faqs.append({"q": "What coverage does this paint give?",
                     "a": f"It covers approximately {spec['coverage']}. Actual coverage varies with surface condition and application method."})
    if spec.get("coats"):
        faqs.append({"q": "How many coats are recommended?",
                     "a": f"{spec['coats']} coats are recommended for the best finish."})
    if spec.get("recommended_primer"):
        faqs.append({"q": "Which primer should I use?",
                     "a": f"Birla Opus recommends {spec['recommended_primer']} before applying this product."})
    if spec.get("drying_time"):
        faqs.append({"q": "How long before I can recoat?",
                     "a": spec["drying_time"] + "."})
    warranty = spec.get("tech_specs", {}).get("Warranty")
    if warranty:
        faqs.append({"q": "Is there a warranty?",
                     "a": f"Yes — this product carries a {warranty} performance guarantee from Birla Opus."})
    return faqs
