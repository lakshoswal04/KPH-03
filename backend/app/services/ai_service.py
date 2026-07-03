import logging
import re
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings

logger = logging.getLogger("kamlesh.ai")

# Current Gemini model (see plan). Older 1.5 aliases are being retired.
GEMINI_MODEL = "gemini-2.5-flash"

# Hard wall-clock cap for a single Gemini call. The deprecated
# google.generativeai SDK does not reliably honour its own request timeout and
# can block indefinitely on a stalled generation, which would hang the sync
# endpoint (and the UI spinner) forever. We enforce the cap ourselves by running
# the call in a worker thread; on timeout we abandon it and fall back to the
# deterministic mock so the endpoint always responds promptly.
GEMINI_TIMEOUT_SECONDS = 20

_gemini_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="gemini")


def _generate_text(prompt: str) -> str:
    """Call Gemini with a hard wall-clock timeout; returns the response text.

    Raises on timeout or any SDK/generation failure so callers fall back to the
    mock. The abandoned worker thread is left to finish and be reclaimed.
    """
    import google.generativeai as genai

    def _run() -> str:
        # transport="rest" is deliberate: the SDK's default gRPC transport can
        # hang indefinitely (ignoring request timeouts) on some networks, which
        # is exactly what stalled these endpoints. REST honours the HTTP timeout
        # and returns in a few seconds.
        genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(
            prompt, request_options={"timeout": GEMINI_TIMEOUT_SECONDS}
        )
        return response.text

    return _gemini_pool.submit(_run).result(timeout=GEMINI_TIMEOUT_SECONDS)


def _clean(text: str) -> str:
    """Strip stray markdown so responses are plain, attractive prose.

    Removes leading list/heading markers and inline ** __ ` emphasis that the
    model sometimes emits despite being asked for plain text.
    """
    text = re.sub(r"[*_`#]+", "", str(text))
    text = re.sub(r"^\s*[-•\d.]+\s*", "", text)  # leading bullet / "1." markers
    return text.strip()


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

    try:
        prompt = (
            "You are a colour consultant for Kamlesh Paints, an authorised Birla Opus dealer in Pune. "
            f"Recommend exactly 3 wall paint shades for a {room_type} with {lighting} lighting, "
            f"aiming for a {mood} mood. Respond as a JSON array of objects with keys "
            '"name", "hex", "reason" and nothing else.'
        )
        text = _generate_text(prompt).strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(text)
        recs = [
            {"name": _clean(r["name"]), "hex": str(r["hex"]).strip(), "reason": _clean(r["reason"])}
            for r in parsed[:3]
        ]
        if recs:
            return recs, False
        raise ValueError("empty recommendations")
    except Exception as exc:  # noqa: BLE001 — any Gemini/parse failure falls back to mock
        logger.warning("Gemini recommend_colours failed, using mock: %s", exc)
        return _mock_recommendations(room_type, mood, lighting), True


def project_plan(
    property_type: str, rooms: str, budget: str, timeline: str
) -> tuple[list[dict[str, str]], str, bool]:
    """Returns (steps, summary, mock). Steps are {title, detail} dicts."""
    if not settings.gemini_enabled:
        return (*project_plan_mock(property_type, rooms, budget, timeline), True)

    import json

    try:
        prompt = (
            "You are a project planner for Kamlesh Paints, an authorised Birla Opus dealer in Pune. "
            f"Create a clear 5-step painting project plan for a {property_type}, rooms: {rooms}, "
            f"budget {budget}, timeline {timeline}. Recommend only Birla Opus products. "
            "Respond as JSON only, an object of the form "
            '{"steps": [{"title": "...", "detail": "..."}], "summary": "..."} with exactly 5 steps. '
            "Each title is 2-5 words; each detail is one or two plain sentences. "
            "The summary is one sentence noting how the budget and timeline map to the plan. "
            "Use plain sentences with no markdown, no asterisks, no hash symbols, no bullet characters."
        )
        text = _generate_text(prompt).strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(text)
        steps = [
            {"title": _clean(s["title"]), "detail": _clean(s["detail"])}
            for s in parsed.get("steps", [])[:5]
        ]
        summary = _clean(parsed.get("summary", ""))
        if steps:
            return steps, summary, False
        raise ValueError("empty plan")
    except Exception as exc:  # noqa: BLE001 — any Gemini/parse failure falls back to the mock plan
        logger.warning("Gemini project_plan failed, using mock: %s", exc)
        return (*project_plan_mock(property_type, rooms, budget, timeline), True)


def project_plan_mock(
    property_type: str, rooms: str, budget: str, timeline: str
) -> tuple[list[dict[str, str]], str]:
    steps = [
        {
            "title": "Free site survey",
            "detail": "Our expert visits, measures every wall, and checks for dampness or cracks.",
        },
        {
            "title": "Surface preparation",
            "detail": "Alldry Wall Fix primer on any damp or cracked walls for a lasting finish.",
        },
        {
            "title": "Colour selection",
            "detail": f"Shortlist Birla Opus shades for {rooms} with our in-store consultant.",
        },
        {
            "title": "Painting",
            "detail": "Two coats of your chosen grade (Style, Calista, or One) by our partner painters.",
        },
        {
            "title": "Handover and warranty",
            "detail": "Final inspection and a written warranty for applicable products.",
        },
    ]
    summary = (
        f"For your {property_type} ({rooms}), a {budget} budget over {timeline} covers "
        "prep, two premium Birla Opus coats, and labour."
    )
    return steps, summary
