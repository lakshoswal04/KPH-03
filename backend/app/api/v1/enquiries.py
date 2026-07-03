from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.enquiry import Enquiry
from app.models.user import User
from app.schemas.enquiry import EnquiryCreate, EnquiryOut
from app.services.email_service import send_notification

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


@router.post("", response_model=EnquiryOut, status_code=201)
def create_enquiry(
    payload: EnquiryCreate,
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
) -> EnquiryOut:
    enquiry = Enquiry(**payload.model_dump(), user_id=current.id if current else None)
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    send_notification("New enquiry", f"{enquiry.name} ({enquiry.phone}): {enquiry.message}")
    return EnquiryOut.model_validate(enquiry)
