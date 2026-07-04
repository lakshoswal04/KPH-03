import math

# Rates per litre by Birla Opus grade, from the PRD calculation spec.
RATES: dict[str, tuple[int, int]] = {
    "style": (150, 200),
    "calista": (220, 360),
    "one": (320, 520),
}


# Realistic emulsion spreading rate (sq ft / litre / coat), per official Birla
# Opus data (interior emulsions publish 120-160 sq ft/L/coat).
COVERAGE_SQFT_PER_L = 120


def calculate_paint(area: float, coats: int, grade: str) -> dict[str, int]:
    """Wall area = floor area * 3.2 * 0.8; coverage ~120 sq ft/litre/coat."""
    wall_area = area * 3.2 * 0.8
    litres = math.ceil((wall_area / COVERAGE_SQFT_PER_L) * coats)
    low, high = RATES[grade]
    return {
        "litres": litres,
        "cost_low": round(litres * low),
        "cost_high": round(litres * high),
        "labour_low": round(wall_area * 10),
        "labour_high": round(wall_area * 16),
    }


# Consumables (rupees per sq ft of wall) — tape, sandpaper, rollers, brushes, drop sheets.
CONSUMABLES_RATE = 1.2
PRIMER_RATE = 180         # ₹/litre for one primer coat
PUTTY_RATE = 22           # ₹/kg
GST_RATE = 18


def calculate_budget(
    area: float,
    coats: int,
    grade: str,
    primer: bool = True,
    putty: bool = True,
) -> dict:
    """Detailed painting estimate with a full material + labour + tax breakdown.
    Deterministic — every figure derives from the inputs and published rates."""
    wall_area = round(area * 3.2 * 0.8)
    base = calculate_paint(area, coats, grade)
    paint_litres = base["litres"]
    paint_low, paint_high = base["cost_low"], base["cost_high"]

    # Primer: one coat at the same ~120 sq ft/litre spreading rate.
    primer_litres = math.ceil(wall_area / COVERAGE_SQFT_PER_L) if primer else 0
    primer_cost = round(primer_litres * PRIMER_RATE)

    # Putty: ~15 sq ft/kg over two coats.
    putty_kg = math.ceil(wall_area / 15) if putty else 0
    putty_cost = round(putty_kg * PUTTY_RATE)

    consumables = round(wall_area * CONSUMABLES_RATE)
    labour_low, labour_high = base["labour_low"], base["labour_high"]

    material_low = paint_low + primer_cost + putty_cost + consumables
    material_high = paint_high + primer_cost + putty_cost + consumables
    gst_low = round(material_low * GST_RATE / 100)
    gst_high = round(material_high * GST_RATE / 100)

    total_low = material_low + labour_low + gst_low
    total_high = material_high + labour_high + gst_high

    return {
        "wall_area": wall_area,
        "paint_litres": paint_litres,
        "primer_litres": primer_litres,
        "putty_kg": putty_kg,
        "breakdown": [
            {"label": "Paint", "low": paint_low, "high": paint_high},
            {"label": "Primer", "low": primer_cost, "high": primer_cost},
            {"label": "Putty", "low": putty_cost, "high": putty_cost},
            {"label": "Consumables", "low": consumables, "high": consumables},
            {"label": "Labour", "low": labour_low, "high": labour_high},
            {"label": f"GST ({GST_RATE}%)", "low": gst_low, "high": gst_high},
        ],
        "material_low": material_low,
        "material_high": material_high,
        "labour_low": labour_low,
        "labour_high": labour_high,
        "gst_low": gst_low,
        "gst_high": gst_high,
        "total_low": total_low,
        "total_high": total_high,
    }
