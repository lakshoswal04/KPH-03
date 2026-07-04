"""WhatsApp conversational engine.

Grounds every reply in the database / fixed business facts (`kb_service`) — it
never invents prices, availability, or policies. Low-confidence or ungrounded
messages escalate to a human. Handles product/price/coverage/delivery/contact/
order-status queries and runs a lead-capture flow for site-survey bookings.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enquiry import Survey
from app.models.whatsapp import WaLead, WaMessage
from app.services import kb_service
from app.services.email_service import send_notification
from app.services.whatsapp_service import send_text

logger = logging.getLogger("kamlesh.whatsapp.bot")

# Keyword → intent. Includes common Hinglish spellings; typo-tolerant via substring.
INTENT_KEYWORDS = {
    "greeting": ["hi", "hello", "hey", "namaste", "namaskar", "gm", "good morning"],
    "delivery": ["deliver", "delivery", "shipping", "ship", "pune delivery"],
    "hours": ["timing", "open", "hours", "kab khula", "time"],
    "contact": ["address", "location", "where", "shop", "number", "contact", "phone"],
    "order_status": ["order status", "my order", "track", "order kaha", "where is my order"],
    "survey": ["survey", "visit", "site visit", "inspection", "book survey", "free survey"],
    "coverage": ["coverage", "how much paint", "litre", "liter", "kitna paint", "sq ft", "area"],
    "price": ["price", "rate", "cost", "kitna", "kitne ka", "how much"],
}

BOOKING_STAGES = ("await_name", "await_location")


def _extract(payload: dict) -> tuple[str, str] | None:
    """Pull (phone, text) from a Meta WhatsApp Cloud API webhook payload."""
    try:
        change = payload["entry"][0]["changes"][0]["value"]
        msg = change["messages"][0]
        if msg.get("type") != "text":
            return None
        return msg["from"], msg["text"]["body"]
    except (KeyError, IndexError, TypeError):
        return None


def _classify(text: str) -> str:
    low = f" {text.lower()} "
    for intent, kws in INTENT_KEYWORDS.items():
        if any(kw in low for kw in kws):
            return intent
    # Fall back to Gemini for anything unmatched (handles other languages/typos).
    if settings.gemini_enabled:
        try:
            from app.services.ai_service import _generate_text

            labels = "greeting, product, price, coverage, delivery, hours, contact, order_status, survey, unknown"
            out = _generate_text(
                f"Classify this paint-shop customer message into exactly one label "
                f"from [{labels}]. Reply with only the label.\nMessage: {text}"
            ).strip().lower()
            for candidate in labels.split(", "):
                if candidate in out:
                    return candidate
        except Exception:  # noqa: BLE001
            pass
    return "product"  # default: try to answer as a product query before escalating


def _get_lead(phone: str, db: Session) -> WaLead:
    lead = db.query(WaLead).filter(WaLead.phone == phone).first()
    if lead is None:
        lead = WaLead(phone=phone, stage="new")
        db.add(lead)
        db.flush()
    return lead


def _escalate(phone: str, text: str) -> str:
    send_notification(
        "WhatsApp: human handoff needed",
        f"{phone} asked: {text}\nThe bot could not answer confidently.",
    )
    return (
        "Let me connect you with our team for that — they'll message you shortly. "
        f"You can also call us on {kb_service.BUSINESS['phone']}."
    )


def _handle_booking(lead: WaLead, text: str, db: Session) -> str:
    """Two-slot site-survey capture: name → locality, then create the survey."""
    if lead.stage == "await_name":
        lead.name = text.strip()[:120]
        lead.stage = "await_location"
        return "Thanks! Which area of Pune is the property in?"
    # await_location
    lead.location = text.strip()[:120]
    lead.stage = "done"
    lead.status = "converted"
    lead.intent = "survey"
    db.add(Survey(
        name=lead.name or "WhatsApp lead", phone=lead.phone, address=lead.location,
        locality=lead.location, property_type="(via WhatsApp)", status="pending",
        notes="Booked via WhatsApp bot",
    ))
    send_notification(
        "WhatsApp: new survey booking",
        f"{lead.name} ({lead.phone}) — {lead.location}",
    )
    return (
        f"Booked! ✅ Our expert will call {lead.phone} to confirm a free site survey "
        f"in {lead.location}. Anything else?"
    )


def _reply_for(intent: str, text: str, phone: str, lead: WaLead, db: Session) -> tuple[str, bool]:
    """Return (reply_text, escalated)."""
    static = kb_service.static_answer(intent)
    if static:
        return static, False

    if intent == "survey":
        lead.stage = "await_name"
        lead.intent = "survey"
        return "Great — I can book a free site survey. What's your name?", False

    if intent == "order_status":
        ans = kb_service.order_status_answer(phone, db)
        return (ans, False) if ans else (_escalate(phone, text), True)

    if intent == "coverage":
        return (
            "Tell me your room's floor area (sq ft) and I'll estimate the paint needed — "
            "or use our calculator at the shop. As a guide, 1 litre covers ~120 sq ft per coat.",
            False,
        )

    # product / price → search the catalogue
    ans = kb_service.product_answer(text, db)
    if ans:
        return ans, False
    return _escalate(phone, text), True


def handle_webhook(payload: dict, db: Session) -> None:
    extracted = _extract(payload)
    if extracted is None:
        return
    phone, text = extracted

    db.add(WaMessage(phone=phone, direction="in", text=text))
    lead = _get_lead(phone, db)

    if lead.stage in BOOKING_STAGES:
        reply, escalated = _handle_booking(lead, text, db), False
    else:
        intent = _classify(text)
        reply, escalated = _reply_for(intent, text, phone, lead, db)
        lead.intent = lead.intent or intent

    db.add(WaMessage(phone=phone, direction="out", text=reply, escalated=escalated))
    db.commit()
    send_text(phone, reply)
    logger.info("WA %s -> intent handled, escalated=%s", phone, escalated)
