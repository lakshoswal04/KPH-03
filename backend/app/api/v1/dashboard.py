"""Admin analytics dashboard. Every number is computed from real order/enquiry/
survey/payment data — nothing is fabricated. Supports day/week/month/quarter/year
period windows for the trend charts."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.product import Product

router = APIRouter(
    prefix="/admin/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_admin)]
)

# Orders that represent realised revenue (payment captured onward).
PAID_STATUSES = ("confirmed", "packed", "shipped", "out_for_delivery", "delivered")

PERIODS = {
    "day": (timedelta(days=1), "hour"),
    "week": (timedelta(days=7), "day"),
    "month": (timedelta(days=30), "day"),
    "quarter": (timedelta(days=90), "week"),
    "year": (timedelta(days=365), "month"),
}


class Kpi(BaseModel):
    revenue: int
    orders: int
    customers: int
    avg_order_value: int
    enquiries: int
    surveys: int
    conversion_rate: float  # paid orders / enquiries+orders, %
    returning_customers: int
    pending_orders: int
    revenue_change_pct: float


class TrendPoint(BaseModel):
    label: str
    revenue: int
    orders: int


class BestSeller(BaseModel):
    product_id: int
    name: str
    units: int
    revenue: int


class PaymentBreakdown(BaseModel):
    total_revenue: int
    gst_collected: int
    captured: int
    pending: int
    failed: int
    refunded: int
    by_method: dict[str, int]
    by_status: dict[str, int]


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/summary", response_model=Kpi)
def summary(period: str = Query("month"), db: Session = Depends(get_db)) -> Kpi:
    window, _ = PERIODS.get(period, PERIODS["month"])
    start = _now() - window
    prev_start = start - window

    def revenue_between(a: datetime, b: datetime | None) -> tuple[int, int]:
        q = db.query(func.coalesce(func.sum(Order.total_amount), 0), func.count(Order.id)).filter(
            Order.status.in_(PAID_STATUSES), Order.created_at >= a
        )
        if b is not None:
            q = q.filter(Order.created_at < b)
        rev, cnt = q.one()
        return int(rev or 0), int(cnt or 0)

    revenue, orders = revenue_between(start, None)
    prev_revenue, _ = revenue_between(prev_start, start)
    change = round((revenue - prev_revenue) / prev_revenue * 100, 1) if prev_revenue else 0.0

    customers = (
        db.query(func.count(func.distinct(Order.user_id)))
        .filter(Order.status.in_(PAID_STATUSES), Order.created_at >= start)
        .scalar()
    ) or 0
    enquiries = db.query(func.count(Enquiry.id)).filter(Enquiry.created_at >= start).scalar() or 0
    surveys = db.query(func.count(Survey.id)).filter(Survey.created_at >= start).scalar() or 0
    pending = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0

    # Returning customers: users with >1 paid order all-time.
    sub = (
        db.query(Order.user_id)
        .filter(Order.status.in_(PAID_STATUSES), Order.user_id.isnot(None))
        .group_by(Order.user_id)
        .having(func.count(Order.id) > 1)
    )
    returning = sub.count()

    leads = enquiries + orders
    conversion = round(orders / leads * 100, 1) if leads else 0.0
    aov = round(revenue / orders) if orders else 0

    return Kpi(
        revenue=revenue, orders=orders, customers=int(customers),
        avg_order_value=aov, enquiries=int(enquiries), surveys=int(surveys),
        conversion_rate=conversion, returning_customers=returning,
        pending_orders=int(pending), revenue_change_pct=change,
    )


@router.get("/sales", response_model=list[TrendPoint])
def sales_trend(period: str = Query("month"), db: Session = Depends(get_db)) -> list[TrendPoint]:
    window, bucket = PERIODS.get(period, PERIODS["month"])
    start = _now() - window
    rows = (
        db.query(
            func.date_trunc(bucket, Order.created_at).label("b"),
            func.coalesce(func.sum(Order.total_amount), 0),
            func.count(Order.id),
        )
        .filter(Order.status.in_(PAID_STATUSES), Order.created_at >= start)
        .group_by("b")
        .order_by("b")
        .all()
    )
    fmt = {"hour": "%H:%M", "day": "%d %b", "week": "%d %b", "month": "%b %Y"}[bucket]
    return [TrendPoint(label=b.strftime(fmt), revenue=int(rev), orders=int(cnt)) for b, rev, cnt in rows]


@router.get("/best-sellers", response_model=list[BestSeller])
def best_sellers(
    period: str = Query("month"), limit: int = 8, db: Session = Depends(get_db)
) -> list[BestSeller]:
    window, _ = PERIODS.get(period, PERIODS["month"])
    start = _now() - window
    rows = (
        db.query(
            OrderItem.product_id,
            Product.name,
            func.sum(OrderItem.quantity).label("units"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("rev"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
        .filter(Order.status.in_(PAID_STATUSES), Order.created_at >= start)
        .group_by(OrderItem.product_id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        BestSeller(product_id=pid, name=name, units=int(u), revenue=int(rev))
        for pid, name, u, rev in rows
    ]


@router.get("/insights")
def insights(db: Session = Depends(get_db)) -> dict:
    """AI-assisted business insights computed from real DB data (never fabricated)."""
    from app.services.insights_service import compute_all, narrative

    data = compute_all(db)
    text, mock = narrative(data)
    return {**data, "summary": text, "mock": mock}


@router.get("/payments", response_model=PaymentBreakdown)
def payments(period: str = Query("month"), db: Session = Depends(get_db)) -> PaymentBreakdown:
    window, _ = PERIODS.get(period, PERIODS["month"])
    start = _now() - window
    q = db.query(Payment).filter(Payment.created_at >= start)
    payments_list = q.all()

    by_method: dict[str, int] = {}
    by_status: dict[str, int] = {}
    total_rev = gst = captured = pending = failed = refunded = 0
    for p in payments_list:
        by_status[p.status] = by_status.get(p.status, 0) + 1
        if p.status == "captured":
            total_rev += p.amount
            gst += p.gst_amount
            captured += 1
            by_method[p.method or "other"] = by_method.get(p.method or "other", 0) + p.amount
        elif p.status == "created":
            pending += 1
        elif p.status == "failed":
            failed += 1
        elif p.status in ("refunded", "partially_refunded"):
            refunded += 1
    return PaymentBreakdown(
        total_revenue=total_rev, gst_collected=gst, captured=captured,
        pending=pending, failed=failed, refunded=refunded,
        by_method=by_method, by_status=by_status,
    )
