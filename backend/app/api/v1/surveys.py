from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.enquiry import Survey
from app.models.user import User
from app.schemas.enquiry import SurveyCreate, SurveyOut
from app.services.email_service import send_notification
from app.services.image_service import save_product_image

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("/upload")
async def upload_reference_image(file: UploadFile = File(...)) -> dict[str, str]:
    """Upload a reference image for a site survey; returns the stored URL."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 8MB)")
    url = save_product_image(file.filename or "survey.jpg", data)
    return {"url": url}


@router.post("", response_model=SurveyOut, status_code=201)
def create_survey(
    payload: SurveyCreate,
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
) -> SurveyOut:
    user_id = current.id if current else None
    if user_id is None:
        matched = db.query(User).filter(
            (User.phone == payload.phone) | (User.email == payload.email) if payload.email else (User.phone == payload.phone)
        ).first()
        if matched:
            user_id = matched.id
    survey = Survey(**payload.model_dump(), user_id=user_id)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    send_notification(
        "New site survey booking",
        f"{survey.name} ({survey.phone}) — {survey.locality}, {survey.property_type}",
    )
    return SurveyOut.model_validate(survey)
