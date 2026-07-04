"""Website chatbot engine — a lightweight RAG grounded in the shop's own data.

Every answer is built from what's in the database (products + specs + colours +
categories) and the fixed business facts in ``kb_service``. Gemini is used only to
phrase a natural reply over that retrieved context, under strict instructions never
to invent prices, stock, policies, or products. When Gemini is unavailable or fails,
a deterministic template answer is returned so the widget always responds.

The bot shares its business facts + product search with the WhatsApp bot
(``kb_service``) so both channels stay consistent.
"""

from __future__ import annotations

import logging

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.colour import Colour
from app.models.product import Product
from app.services import kb_service

logger = logging.getLogger("kamlesh.chat")

# Colour-family keywords → the canonical family name used in the DB.
FAMILY_KEYWORDS = {
    "white": "Whites", "whites": "Whites", "off-white": "Whites", "ivory": "Whites",
    "yellow": "Yellows", "yellows": "Yellows", "mustard": "Yellows", "gold": "Yellows",
    "orange": "Oranges", "oranges": "Oranges", "peach": "Oranges", "terracotta": "Oranges",
    "red": "Reds", "reds": "Reds", "maroon": "Reds", "pink": "Reds", "crimson": "Reds",
    "purple": "Purples", "purples": "Purples", "violet": "Purples", "lavender": "Purples", "mauve": "Purples",
    "blue": "Blues", "blues": "Blues", "navy": "Blues", "indigo": "Blues", "teal": "Blue-Greens",
    "green": "Greens", "greens": "Greens", "olive": "Yellow-Greens", "lime": "Yellow-Greens",
    "grey": "Neutrals", "gray": "Neutrals", "beige": "Neutrals", "brown": "Neutrals",
    "neutral": "Neutrals", "neutrals": "Neutrals", "taupe": "Neutrals",
}

COLOUR_TRIGGERS = ("colour", "color", "shade", "shades", "paint colour", "wall colour")


def _wants_colours(text: str) -> bool:
    low = text.lower()
    return any(t in low for t in COLOUR_TRIGGERS) or any(k in low.split() for k in FAMILY_KEYWORDS)


def find_colours(text: str, db: Session, limit: int = 6) -> list[Colour]:
    """Retrieve relevant shades by family keyword, code, or name substring."""
    low = text.lower()
    families = {fam for kw, fam in FAMILY_KEYWORDS.items() if kw in low.split()}
    q = db.query(Colour)
    if families:
        q = q.filter(Colour.family.in_(families))
    else:
        # Fall back to a name/code match on the salient words.
        words = [w.strip(".,!?") for w in low.split() if len(w.strip(".,!?")) > 3]
        conds = []
        for w in words:
            conds.append(Colour.name.ilike(f"%{w}%"))
            conds.append(Colour.code.ilike(f"%{w}%"))
        if not conds:
            return []
        q = q.filter(or_(*conds))
    return q.order_by(Colour.is_explorer_shade.desc(), Colour.sort_order).limit(limit).all()


def _product_context(products: list[Product]) -> str:
    """Compact, grounded product facts for the LLM prompt."""
    lines = []
    for p in products:
        price = f"from Rs.{p.price_low}/{p.price_unit}" if p.price_low else "price on request"
        stock = "in stock" if p.available_stock > 0 else "out of stock"
        parts = [f"{p.name} ({p.sub_brand}, {p.tab}) — {price}, {stock}"]
        if p.summary or p.description:
            parts.append(f"  About: {p.summary or p.description}")
        if p.coverage:
            parts.append(f"  Coverage: {p.coverage}")
        if p.finish:
            parts.append(f"  Finish: {p.finish}")
        if p.coats:
            parts.append(f"  Coats: {p.coats}")
        warranty = (p.tech_specs or {}).get("Warranty")
        if warranty:
            parts.append(f"  Warranty: {warranty}")
        if p.pack_sizes:
            parts.append(f"  Pack sizes: {', '.join(p.pack_sizes)}")
        if p.benefits:
            parts.append(f"  Benefits: {', '.join(p.benefits[:6])}")
        lines.append("\n".join(parts))
    return "\n".join(lines)


def _colour_context(colours: list[Colour]) -> str:
    return "\n".join(f"{c.name} ({c.code or 'n/a'}, {c.family}) {c.hex}" for c in colours)


SYSTEM = (
    "You are the friendly assistant for Kamlesh Paints & Hardware, an authorised Birla Opus "
    "dealer in Pune. Answer customer questions using ONLY the CONTEXT provided. Rules: never "
    "invent prices, stock, warranties, coverage, or policies — if a detail isn't in the context, "
    "say you're not sure and offer to connect them on WhatsApp. Prices are in Indian Rupees (₹). "
    "Keep replies concise (2-4 sentences), warm, and practical. When products or shades are in "
    "the context, mention them by name; the app shows their cards below your reply, so don't dump "
    "long lists. For orders, colour matching, or site visits, invite them to WhatsApp or visit the "
    "shop."
)


def _deterministic_reply(message: str, products: list[Product], colours: list[Colour], db: Session) -> str:
    """Grounded fallback when Gemini is unavailable."""
    low = message.lower()
    for intent in ("greeting", "contact", "hours", "delivery"):
        if intent == "greeting" and not any(w in low for w in ("hi", "hello", "hey", "namaste")):
            continue
        if intent == "contact" and not any(w in low for w in ("address", "location", "where", "contact", "phone", "number")):
            continue
        if intent == "hours" and not any(w in low for w in ("time", "timing", "open", "hours", "close")):
            continue
        if intent == "delivery" and not any(w in low for w in ("deliver", "delivery", "shipping")):
            continue
        ans = kb_service.static_answer(intent)
        if ans:
            return ans
    if products:
        ans = kb_service.product_answer(message, db)
        if ans:
            return ans.replace("*", "")
    if colours:
        names = ", ".join(f"{c.name} ({c.hex})" for c in colours[:4])
        return f"Here are some Birla Opus shades you might like: {names}. Every shade is mixable in-store at Kamlesh."
    return (
        "I can help with Birla Opus paints, waterproofing, enamels, wood finishes, tools, colours, "
        f"prices, and delivery. Could you tell me a bit more? You can also reach our team on "
        f"WhatsApp at {kb_service.BUSINESS['phone']}."
    )


def answer(message: str, history: list[dict], db: Session) -> dict:
    """Return {reply, products, colours, escalate, mock} for a website chat turn."""
    products = kb_service.search_products(message, db, limit=4)
    colours = find_colours(message, db) if _wants_colours(message) else []

    reply: str
    mock: bool
    if settings.gemini_enabled:
        try:
            from app.services.ai_service import _generate_text

            b = kb_service.BUSINESS
            biz = (
                f"Shop: {b['name']}. Address: {b['address']}. Phone/WhatsApp: {b['phone']}. "
                f"Hours: {b['hours']}. Delivery: {b['delivery']}."
            )
            convo = "\n".join(
                f"{m['role'].capitalize()}: {m['content']}" for m in history[-6:]
            )
            context = (
                f"BUSINESS: {biz}\n\n"
                f"MATCHING PRODUCTS:\n{_product_context(products) or 'none found'}\n\n"
                f"MATCHING SHADES:\n{_colour_context(colours) or 'none requested'}"
            )
            prompt = (
                f"{SYSTEM}\n\n=== CONTEXT ===\n{context}\n\n=== CONVERSATION ===\n"
                f"{convo}\nUser: {message}\nAssistant:"
            )
            text = _generate_text(prompt).strip()
            reply, mock = (text or _deterministic_reply(message, products, colours, db)), (not bool(text))
        except Exception:  # noqa: BLE001
            logger.warning("chat: Gemini failed, using deterministic fallback", exc_info=True)
            reply, mock = _deterministic_reply(message, products, colours, db), True
    else:
        reply, mock = _deterministic_reply(message, products, colours, db), True

    # Escalate when we found nothing to ground an answer in.
    escalate = not products and not colours and len(message.split()) > 2

    return {
        "reply": reply,
        "products": [
            {
                "id": p.id, "slug": p.slug, "name": p.name, "sub_brand": p.sub_brand,
                "tab": p.tab, "image_url": p.image_url, "price_low": p.price_low,
                "price_unit": p.price_unit,
            }
            for p in products
        ],
        "colours": [
            {"id": c.id, "code": c.code, "name": c.name, "hex": c.hex, "family": c.family}
            for c in colours
        ],
        "escalate": escalate,
        "mock": mock,
    }
