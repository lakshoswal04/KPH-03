from app.core.config import settings

# Curated Birla Opus explorer shades used for deterministic mock recommendations
# when no Gemini key is configured.
_SHADES: list[tuple[str, str, str]] = [
    ("Off White", "#F5F0E8", "Opens up smaller rooms and bounces natural light around."),
    ("Warm Sand", "#E8C4A0", "A cosy neutral that pairs with wood tones and warm lighting."),
    ("Sage Garden", "#A8C8A0", "Calming green that works beautifully in low-light rooms."),
    ("Ocean Teal", "#0ABFBC", "A fresh, energetic accent for feature walls."),
    ("Steel Blue", "#5B8DB8", "Cool and composed — ideal for focused workspaces."),
    ("Dusty Rose", "#D4537E", "Soft warmth that makes bedrooms feel intimate."),
    ("Terracotta", "#D4956A", "Earthy and grounded, great with indoor plants."),
    ("Sunflower", "#F5C518", "Bright optimism for kitchens and kids' rooms."),
]

_MOOD_KEYS = {
    "calm": ["Sage Garden", "Off White", "Steel Blue"],
    "cozy": ["Warm Sand", "Terracotta", "Dusty Rose"],
    "cosy": ["Warm Sand", "Terracotta", "Dusty Rose"],
    "energetic": ["Sunflower", "Ocean Teal", "Terracotta"],
    "luxury": ["Dusty Rose", "Steel Blue", "Warm Sand"],
}


def _mock_recommendations(room_type: str, mood: str, lighting: str) -> list[dict[str, str]]:
    names = None
    for key, picks in _MOOD_KEYS.items():
        if key in mood.lower():
            names = picks
            break
    if names is None:
        # Deterministic pick based on room type so results feel intentional.
        start = sum(ord(c) for c in room_type.lower()) % len(_SHADES)
        names = [_SHADES[(start + i * 2) % len(_SHADES)][0] for i in range(3)]
    by_name = {name: (hex_, reason) for name, hex_, reason in _SHADES}
    return [
        {"name": n, "hex": by_name[n][0], "reason": by_name[n][1]}
        for n in names
        if n in by_name
    ]


def recommend_colours(room_type: str, mood: str, lighting: str) -> tuple[list[dict[str, str]], bool]:
    """Returns (recommendations, mock). Uses Gemini when configured, else the mock."""
    if not settings.gemini_enabled:
        return _mock_recommendations(room_type, mood, lighting), True

    import json

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = (
        "You are a colour consultant for Kamlesh Paints, an authorised Birla Opus dealer in Pune. "
        f"Recommend exactly 3 wall paint shades for a {room_type} with {lighting} lighting, "
        f"aiming for a {mood} mood. Respond as a JSON array of objects with keys "
        '"name", "hex", "reason" and nothing else.'
    )
    response = model.generate_content(prompt)
    text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        recs = [
            {"name": str(r["name"]), "hex": str(r["hex"]), "reason": str(r["reason"])}
            for r in parsed[:3]
        ]
        return recs, False
    except (json.JSONDecodeError, KeyError, TypeError):
        return _mock_recommendations(room_type, mood, lighting), True


def project_plan(property_type: str, rooms: str, budget: str, timeline: str) -> tuple[str, bool]:
    if not settings.gemini_enabled:
        plan = (
            f"Project plan for your {property_type} ({rooms}), budget {budget}, timeline {timeline}:\n\n"
            "1. Free site survey — our expert visits, measures every wall, and checks for dampness.\n"
            "2. Surface prep — Alldry Wall Fix 4 primer on any damp or cracked walls.\n"
            "3. Colour selection — shortlist Birla Opus shades per room with our consultant.\n"
            "4. Painting — 2 coats of your chosen grade (Style / Calista / One) with our partner painters.\n"
            "5. Handover — final inspection and a written warranty for applicable products.\n\n"
            "Book a free site survey to turn this into an exact written quote."
        )
        return plan, True

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = (
        "You are a project planner for Kamlesh Paints, an authorised Birla Opus dealer in Pune. "
        f"Create a concise 5-step painting project plan for a {property_type}, rooms: {rooms}, "
        f"budget {budget}, timeline {timeline}. Recommend only Birla Opus products. Plain text."
    )
    response = model.generate_content(prompt)
    return response.text.strip(), False
