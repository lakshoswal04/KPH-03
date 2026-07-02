from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order
from app.models.user import User
from app.schemas.enquiry import EnquiryOut, SurveyOut
from app.schemas.order import OrderOut

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)


@router.get("/enquiries", response_model=list[EnquiryOut])
def list_enquiries(db: Session = Depends(get_db)) -> list[EnquiryOut]:
    rows = db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()
    return [EnquiryOut.model_validate(r) for r in rows]


@router.get("/surveys", response_model=list[SurveyOut])
def list_surveys(db: Session = Depends(get_db)) -> list[SurveyOut]:
    rows = db.query(Survey).order_by(Survey.created_at.desc()).all()
    return [SurveyOut.model_validate(r) for r in rows]


@router.get("/orders", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> list[OrderOut]:
    rows = (
        db.query(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderOut.model_validate(r) for r in rows]
