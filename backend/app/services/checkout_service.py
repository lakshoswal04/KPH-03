"""Checkout pricing, coupon validation, and stock reservation/deduction.

All money is in whole rupees. Pricing is server-authoritative — unit prices are
always resolved from the product's own variants, never trusted from the client.
"""

from __future__ import annotations

from datetime import datetime, timezone
from dataclasses import dataclass, field

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.coupon import Coupon
from app.models.inventory import InventoryLog
from app.models.product import Product


@dataclass
class LineItem:
    product: Product
    variant_label: str | None
    quantity: int
    unit_price: int

    @property
    def line_total(self) -> int:
        return self.unit_price * self.quantity


@dataclass
class Totals:
    lines: list[LineItem]
    subtotal: int
    discount: int
    gst_amount: int
    delivery_charge: int
    total: int
    coupon_code: str | None = None
    coupon_message: str | None = None
    warnings: list[str] = field(default_factory=list)


def unit_price_for(product: Product, variant_label: str | None) -> int:
    """Resolve the chosen pack price from the product's own variants."""
    if variant_label:
        for variant in product.variants or []:
            if variant.get("label") == variant_label:
                return int(variant["price"])
    if product.price is not None:
        return int(product.price)
    return int(product.price_low)


def _resolve_lines(items, db: Session) -> list[LineItem]:
    product_ids = [it.product_id for it in items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    by_id = {p.id: p for p in products}
    missing = set(product_ids) - set(by_id)
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown product ids: {sorted(missing)}")
    lines: list[LineItem] = []
    for it in items:
        product = by_id[it.product_id]
        if not product.is_active:
            raise HTTPException(status_code=400, detail=f"{product.name} is no longer available")
        lines.append(
            LineItem(product, it.variant_label, it.quantity, unit_price_for(product, it.variant_label))
        )
    return lines


def validate_coupon(code: str, subtotal: int, db: Session) -> tuple[Coupon | None, int, str]:
    """Return (coupon, discount_rupees, message). discount 0 + message on failure."""
    coupon = db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()
    if coupon is None or not coupon.active:
        return None, 0, "Invalid coupon code"
    if coupon.expiry and coupon.expiry < datetime.now(timezone.utc):
        return None, 0, "This coupon has expired"
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        return None, 0, "This coupon has reached its usage limit"
    if subtotal < coupon.min_order:
        return None, 0, f"Add ₹{coupon.min_order - subtotal} more to use this coupon"
    if coupon.discount_type == "percent":
        discount = subtotal * coupon.value // 100
    else:
        discount = coupon.value
    if coupon.max_discount is not None:
        discount = min(discount, coupon.max_discount)
    discount = min(discount, subtotal)
    return coupon, discount, f"Coupon applied — you saved ₹{discount}"


def compute_totals(items, coupon_code: str | None, db: Session) -> Totals:
    lines = _resolve_lines(items, db)
    subtotal = sum(line.line_total for line in lines)

    discount = 0
    applied_code = None
    coupon_message = None
    if coupon_code:
        _, discount, coupon_message = validate_coupon(coupon_code, subtotal, db)
        if discount > 0:
            applied_code = coupon_code.strip().upper()

    taxable = subtotal - discount
    gst_amount = round(taxable * settings.GST_RATE / 100)
    delivery = 0 if taxable >= settings.FREE_DELIVERY_THRESHOLD else settings.DELIVERY_CHARGE
    total = taxable + gst_amount + delivery

    warnings: list[str] = []
    for line in lines:
        if line.product.available_stock < line.quantity:
            warnings.append(
                f"Only {line.product.available_stock} of {line.product.name} in stock"
            )

    return Totals(
        lines=lines,
        subtotal=subtotal,
        discount=discount,
        gst_amount=gst_amount,
        delivery_charge=delivery,
        total=total,
        coupon_code=applied_code,
        coupon_message=coupon_message,
        warnings=warnings,
    )


def reserve_stock(lines: list[LineItem], order_id: int, db: Session) -> None:
    """Reserve stock for an order. Raises 409 if any line is short."""
    for line in lines:
        p = line.product
        if p.available_stock < line.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for {p.name} (available {p.available_stock})",
            )
    for line in lines:
        p = line.product
        p.reserved = (p.reserved or 0) + line.quantity
        db.add(InventoryLog(
            product_id=p.id, change=-line.quantity, reason="reserve",
            note=f"order #{order_id}", balance_after=p.available_stock,
        ))


def commit_stock_sale(order, db: Session) -> None:
    """On payment success: convert reservation into an actual stock decrement."""
    for item in order.items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if p is None:
            continue
        p.reserved = max(0, (p.reserved or 0) - item.quantity)
        p.stock = max(0, (p.stock or 0) - item.quantity)
        db.add(InventoryLog(
            product_id=p.id, change=-item.quantity, reason="sale",
            note=f"order #{order.id}", balance_after=p.stock,
        ))


def release_stock(order, db: Session) -> None:
    """On cancellation/failure: release any still-held reservation."""
    for item in order.items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if p is None:
            continue
        p.reserved = max(0, (p.reserved or 0) - item.quantity)
        db.add(InventoryLog(
            product_id=p.id, change=item.quantity, reason="release",
            note=f"order #{order.id}", balance_after=p.available_stock,
        ))
