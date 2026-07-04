"""WhatsApp Business Cloud API send helper.

Sends via Meta's Graph API when WHATSAPP_TOKEN/PHONE_ID are configured; otherwise
logs the message (dev/mock) so flows stay testable without credentials. The
inbound webhook, NLU, and knowledge-base grounding are added in the WhatsApp
automation phase.
"""

import logging

from app.core.config import settings

logger = logging.getLogger("kamlesh.whatsapp")

GRAPH_URL = "https://graph.facebook.com/v19.0"


def _normalize(phone: str) -> str:
    """WhatsApp expects msisdn without +/spaces; default Indian country code."""
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    return digits


def send_text(to: str | None, body: str) -> bool:
    """Send a plain-text WhatsApp message. Returns True on success (or mock)."""
    if not to:
        return False
    if not settings.whatsapp_enabled:
        logger.info("WHATSAPP (mock) | to=%s | %s", to, body)
        return True
    try:
        import requests

        resp = requests.post(
            f"{GRAPH_URL}/{settings.WHATSAPP_PHONE_ID}/messages",
            headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}"},
            json={
                "messaging_product": "whatsapp",
                "to": _normalize(to),
                "type": "text",
                "text": {"body": body[:4096]},
            },
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:  # noqa: BLE001 — never break the calling request
        logger.warning("WhatsApp send failed (%s): to=%s", exc, to)
        return False
