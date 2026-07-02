from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enquiry import Survey
from app.schemas.enquiry import SurveyCreate, SurveyOut
from app.services.email_service import send_notification

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("", response_model=SurveyOut, status_code=201)
def create_survey(payload: SurveyCreate, db: Session = Depends(get_db)) -> SurveyOut:
    survey = Survey(**payload.model_dump())
    db.add(survey)
    db.commit()
    db.refresh(survey)
    send_notification(
        "New site survey booking",
        f"{survey.name} ({survey.phone}) — {survey.locality}, {survey.property_type}",
    )
    return SurveyOut.model_validate(survey)
