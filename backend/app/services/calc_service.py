import math

# Rates per litre by Birla Opus grade, from the PRD calculation spec.
RATES: dict[str, tuple[int, int]] = {
    "style": (150, 200),
    "calista": (220, 360),
    "one": (320, 520),
}


def calculate_paint(area: float, coats: int, grade: str) -> dict[str, int]:
    """PRD formula: wall area = floor area * 3.2 * 0.8, coverage 10 sq ft / litre / coat."""
    wall_area = area * 3.2 * 0.8
    litres = math.ceil((wall_area / 10) * coats)
    low, high = RATES[grade]
    return {
        "litres": litres,
        "cost_low": round(litres * low),
        "cost_high": round(litres * high),
        "labour_low": round(wall_area * 10),
        "labour_high": round(wall_area * 16),
    }
