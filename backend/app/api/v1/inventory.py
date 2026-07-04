from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.inventory import InventoryLog
from app.models.product import Product

router = APIRouter(
    prefix="/admin/inventory", tags=["inventory"], dependencies=[Depends(get_current_admin)]
)


class StockRow(BaseModel):
    id: int
    name: str
    sku: str | None
    sub_brand: str
    tab: str
    stock: int
    reserved: int
    available: int
    low_stock_threshold: int
    status: str  # in_stock | low | out


class InventorySummary(BaseModel):
    total_skus: int
    in_stock: int
    low_stock: int
    out_of_stock: int
    total_units: int
    reserved_units: int
    restocked_30d: int
    rows: list[StockRow]


class StockAdjust(BaseModel):
    # reason: restock | incoming | adjust | correction
    change: int = Field(description="Positive to add stock, negative to remove")
    reason: str = "restock"
    note: str | None = None


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    change: int
    reason: str
    note: str | None
    balance_after: int | None
    created_at: datetime


def _status(p: Product) -> str:
    if p.available_stock <= 0:
        return "out"
    if p.available_stock <= (p.low_stock_threshold or 0):
        return "low"
    return "in_stock"


@router.get("", response_model=InventorySummary)
def inventory_summary(db: Session = Depends(get_db)) -> InventorySummary:
    products = db.query(Product).all()
    rows = [
        StockRow(
            id=p.id, name=p.name, sku=p.sku, sub_brand=p.sub_brand, tab=p.tab,
            stock=p.stock or 0, reserved=p.reserved or 0, available=p.available_stock,
            low_stock_threshold=p.low_stock_threshold or 0, status=_status(p),
        )
        for p in products
    ]
    rows.sort(key=lambda r: (r.status != "out", r.status != "low", r.available))
    since = datetime.now(timezone.utc) - timedelta(days=30)
    restocked = (
        db.query(func.coalesce(func.sum(InventoryLog.change), 0))
        .filter(InventoryLog.reason.in_(["restock", "incoming"]), InventoryLog.created_at >= since)
        .scalar()
    )
    return InventorySummary(
        total_skus=len(rows),
        in_stock=sum(1 for r in rows if r.status == "in_stock"),
        low_stock=sum(1 for r in rows if r.status == "low"),
        out_of_stock=sum(1 for r in rows if r.status == "out"),
        total_units=sum(r.stock for r in rows),
        reserved_units=sum(r.reserved for r in rows),
        restocked_30d=int(restocked or 0),
        rows=rows,
    )


@router.post("/{product_id}/adjust", response_model=StockRow)
def adjust_stock(
    product_id: int, payload: StockAdjust, db: Session = Depends(get_db)
) -> StockRow:
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    new_stock = (p.stock or 0) + payload.change
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot go negative")
    p.stock = new_stock
    db.add(InventoryLog(
        product_id=p.id, change=payload.change, reason=payload.reason,
        note=payload.note, balance_after=p.stock,
    ))
    db.commit()
    db.refresh(p)
    return StockRow(
        id=p.id, name=p.name, sku=p.sku, sub_brand=p.sub_brand, tab=p.tab,
        stock=p.stock or 0, reserved=p.reserved or 0, available=p.available_stock,
        low_stock_threshold=p.low_stock_threshold or 0, status=_status(p),
    )


@router.get("/{product_id}/logs", response_model=list[LogOut])
def product_logs(product_id: int, db: Session = Depends(get_db)) -> list[LogOut]:
    rows = (
        db.query(InventoryLog)
        .filter(InventoryLog.product_id == product_id)
        .order_by(InventoryLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [LogOut.model_validate(r) for r in rows]
