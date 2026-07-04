from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order
from app.models.user import User

router = APIRouter(
    prefix="/admin/customers", tags=["customers"], dependencies=[Depends(get_current_admin)]
)

PAID = ("confirmed", "packed", "shipped", "out_for_delivery", "delivered")


class CustomerRow(BaseModel):
    id: int
    full_name: str | None
    email: str
    phone: str | None
    is_admin: bool
    orders: int
    spent: int
    created_at: datetime


class ActivityItem(BaseModel):
    at: datetime
    kind: str  # order | enquiry | survey
    detail: str


class CustomerDetail(BaseModel):
    id: int
    full_name: str | None
    email: str
    phone: str | None
    notes: str | None
    addresses: list
    orders: int
    spent: int
    enquiries: int
    surveys: int
    timeline: list[ActivityItem]


class NotesUpdate(BaseModel):
    notes: str


@router.get("", response_model=list[CustomerRow])
def list_customers(search: str | None = None, db: Session = Depends(get_db)) -> list[CustomerRow]:
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))
    users = q.order_by(User.created_at.desc()).all()
    # Aggregate paid orders/spend per user in one grouped query.
    agg = dict(
        (uid, (cnt, spent))
        for uid, cnt, spent in db.query(
            Order.user_id, func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0)
        )
        .filter(Order.status.in_(PAID), Order.user_id.isnot(None))
        .group_by(Order.user_id)
        .all()
    )
    return [
        CustomerRow(
            id=u.id, full_name=u.full_name, email=u.email, phone=u.phone, is_admin=u.is_admin,
            orders=int(agg.get(u.id, (0, 0))[0]), spent=int(agg.get(u.id, (0, 0))[1]),
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=CustomerDetail)
def customer_detail(user_id: int, db: Session = Depends(get_db)) -> CustomerDetail:
    u = db.query(User).filter(User.id == user_id).first()
    if u is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders = (
        db.query(Order).options(selectinload(Order.items))
        .filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    )
    enquiries = db.query(Enquiry).filter(Enquiry.user_id == user_id).all()
    surveys = db.query(Survey).filter(Survey.user_id == user_id).all()

    timeline: list[ActivityItem] = []
    for o in orders:
        timeline.append(ActivityItem(at=o.created_at, kind="order",
                                     detail=f"Order #{o.id} — ₹{o.total_amount:,} ({o.status})"))
    for e in enquiries:
        timeline.append(ActivityItem(at=e.created_at, kind="enquiry", detail=e.message[:80]))
    for s in surveys:
        timeline.append(ActivityItem(at=s.created_at, kind="survey",
                                     detail=f"Survey — {s.locality} ({s.status})"))
    timeline.sort(key=lambda x: x.at, reverse=True)

    spent = sum(o.total_amount for o in orders if o.status in PAID)
    return CustomerDetail(
        id=u.id, full_name=u.full_name, email=u.email, phone=u.phone,
        notes=u.notes, addresses=u.addresses or [],
        orders=len([o for o in orders if o.status in PAID]), spent=spent,
        enquiries=len(enquiries), surveys=len(surveys), timeline=timeline[:50],
    )


@router.patch("/{user_id}/notes", response_model=CustomerDetail)
def update_notes(user_id: int, payload: NotesUpdate, db: Session = Depends(get_db)) -> CustomerDetail:
    u = db.query(User).filter(User.id == user_id).first()
    if u is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    u.notes = payload.notes
    db.commit()
    return customer_detail(user_id, db)
