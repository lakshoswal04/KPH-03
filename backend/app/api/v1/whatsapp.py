"""WhatsApp Business Cloud API webhook. Verification + inbound handling.

The conversational engine (NLU, knowledge-base grounding, lead capture, human
escalation) is implemented in the WhatsApp automation phase; this module wires
the Meta webhook contract and delegates inbound messages to that engine.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.whatsapp import WaLead, WaMessage

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class WaLeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str | None
    intent: str | None
    budget: str | None
    location: str | None
    stage: str
    status: str
    created_at: datetime


@router.get("/leads", response_model=list[WaLeadOut], dependencies=[Depends(get_current_admin)])
def list_leads(db: Session = Depends(get_db)) -> list[WaLeadOut]:
    rows = db.query(WaLead).order_by(WaLead.updated_at.desc()).all()
    return [WaLeadOut.model_validate(r) for r in rows]


@router.get("/messages/{phone}", dependencies=[Depends(get_current_admin)])
def conversation(phone: str, db: Session = Depends(get_db)) -> list[dict]:
    rows = (
        db.query(WaMessage).filter(WaMessage.phone == phone)
        .order_by(WaMessage.created_at).all()
    )
    return [{"direction": m.direction, "text": m.text, "at": m.created_at.isoformat()} for m in rows]


@router.get("/webhook")
def verify_webhook(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_challenge: str = Query("", alias="hub.challenge"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
) -> Response:
    """Meta calls this once to verify the webhook; echo the challenge on match."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    return Response(content="verification failed", status_code=403)


@router.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    payload = await request.json()
    from app.services.whatsapp_bot import handle_webhook

    handle_webhook(payload, db)
    return {"status": "ok"}
