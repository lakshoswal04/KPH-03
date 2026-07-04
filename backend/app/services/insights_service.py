"""AI-assisted business insights, computed strictly from real database data.

Every figure is derived deterministically from orders/products/customers — nothing
is fabricated. Gemini is used only to phrase a natural-language summary over the
already-computed numbers (and only when a key is configured); the structured data
is always the deterministic source of truth.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User

PAID = ("confirmed", "packed", "shipped", "out_for_delivery", "delivered")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def sales_forecast(db: Session) -> dict:
    """Project next 30 days' revenue from the last 90 days' daily trend
    (least-squares slope over daily totals)."""
    start = _now() - timedelta(days=90)
    rows = (
        db.query(func.date_trunc("day", Order.created_at), func.sum(Order.total_amount))
        .filter(Order.status.in_(PAID), Order.created_at >= start)
        .group_by(func.date_trunc("day", Order.created_at))
        .order_by(func.date_trunc("day", Order.created_at))
        .all()
    )
    if len(rows) < 2:
        totals = [int(r[1] or 0) for r in rows]
        daily = (sum(totals) / len(totals)) if totals else 0
        return {"method": "average", "daily_avg": round(daily), "next_30d": round(daily * 30),
                "confidence": "low", "points": len(rows)}
    ys = [float(r[1] or 0) for r in rows]
    xs = list(range(len(ys)))
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    denom = sum((x - mx) ** 2 for x in xs) or 1
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom
    intercept = my - slope * mx
    projected = [max(0.0, intercept + slope * (n + i)) for i in range(30)]
    return {
        "method": "linear_trend",
        "daily_avg": round(my),
        "trend_per_day": round(slope),
        "next_30d": round(sum(projected)),
        "confidence": "medium" if n >= 14 else "low",
        "points": n,
    }


def slow_moving(db: Session, days: int = 60, limit: int = 10) -> list[dict]:
    """In-stock products with the fewest units sold in the window."""
    start = _now() - timedelta(days=days)
    sold = dict(
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(PAID), Order.created_at >= start)
        .group_by(OrderItem.product_id)
        .all()
    )
    products = db.query(Product).filter(Product.stock > 0, Product.is_active.is_(True)).all()
    ranked = sorted(
        (
            {"id": p.id, "name": p.name, "stock": p.stock, "sold": int(sold.get(p.id, 0) or 0)}
            for p in products
        ),
        key=lambda d: (d["sold"], -d["stock"]),
    )
    return ranked[:limit]


def cross_sell(db: Session, limit: int = 8) -> list[dict]:
    """Product pairs most frequently bought in the same order."""
    orders = defaultdict(list)
    for oid, pid in (
        db.query(OrderItem.order_id, OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(PAID))
        .all()
    ):
        orders[oid].append(pid)
    pair_counts: dict[tuple[int, int], int] = defaultdict(int)
    for items in orders.values():
        uniq = sorted(set(items))
        for i in range(len(uniq)):
            for j in range(i + 1, len(uniq)):
                pair_counts[(uniq[i], uniq[j])] += 1
    if not pair_counts:
        return []
    names = {p.id: p.name for p in db.query(Product).all()}
    top = sorted(pair_counts.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    return [
        {"a": names.get(a, str(a)), "b": names.get(b, str(b)), "count": c}
        for (a, b), c in top
    ]


def high_value_customers(db: Session, limit: int = 8) -> list[dict]:
    rows = (
        db.query(User.id, User.full_name, User.email,
                 func.count(Order.id), func.sum(Order.total_amount))
        .join(Order, Order.user_id == User.id)
        .filter(Order.status.in_(PAID))
        .group_by(User.id, User.full_name, User.email)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(limit)
        .all()
    )
    return [
        {"id": uid, "name": name or email, "orders": int(cnt), "spent": int(spent or 0)}
        for uid, name, email, cnt, spent in rows
    ]


def segmentation(db: Session) -> dict:
    """New (1 order), returning (2+), and dormant (no order in 90 days) buyers."""
    counts = dict(
        db.query(Order.user_id, func.count(Order.id))
        .filter(Order.status.in_(PAID), Order.user_id.isnot(None))
        .group_by(Order.user_id)
        .all()
    )
    last = dict(
        db.query(Order.user_id, func.max(Order.created_at))
        .filter(Order.status.in_(PAID), Order.user_id.isnot(None))
        .group_by(Order.user_id)
        .all()
    )
    cutoff = _now() - timedelta(days=90)
    new = sum(1 for c in counts.values() if c == 1)
    returning = sum(1 for c in counts.values() if c >= 2)
    dormant = sum(1 for uid, dt in last.items() if dt and dt < cutoff)
    return {"new": new, "returning": returning, "dormant": dormant, "total_buyers": len(counts)}


def restock_recommendations(db: Session, days: int = 30) -> list[dict]:
    """Best-sellers whose available stock is at or below the low-stock threshold."""
    start = _now() - timedelta(days=days)
    sold = dict(
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(PAID), Order.created_at >= start)
        .group_by(OrderItem.product_id)
        .all()
    )
    out: list[dict] = []
    for p in db.query(Product).filter(Product.is_active.is_(True)).all():
        units = int(sold.get(p.id, 0) or 0)
        if units > 0 and p.available_stock <= (p.low_stock_threshold or 0):
            out.append({
                "id": p.id, "name": p.name, "available": p.available_stock,
                "sold_recent": units, "suggested_reorder": max(units, p.low_stock_threshold or 0) * 2,
            })
    return sorted(out, key=lambda d: d["sold_recent"], reverse=True)[:10]


def compute_all(db: Session) -> dict:
    return {
        "forecast": sales_forecast(db),
        "slow_moving": slow_moving(db),
        "cross_sell": cross_sell(db),
        "high_value_customers": high_value_customers(db),
        "segmentation": segmentation(db),
        "restock": restock_recommendations(db),
    }


def narrative(data: dict) -> tuple[str, bool]:
    """Natural-language summary of the computed insights. Uses Gemini when
    available; otherwise a deterministic template. Returns (text, mock)."""
    seg = data["segmentation"]
    fc = data["forecast"]
    template = (
        f"Projected revenue for the next 30 days is about ₹{fc['next_30d']:,} "
        f"({fc['method'].replace('_', ' ')}, {fc['confidence']} confidence). "
        f"You have {seg['returning']} returning and {seg['new']} new buyers"
        f"{f', with {seg['dormant']} dormant (re-engage them)' if seg['dormant'] else ''}. "
        f"{len(data['restock'])} best-sellers need restocking; "
        f"{len(data['slow_moving'])} products are moving slowly."
    )
    from app.core.config import settings

    if not settings.gemini_enabled:
        return template, True
    try:
        from app.services.ai_service import _generate_text

        prompt = (
            "You are a retail analyst for a paint shop. In 3-4 concise sentences, summarise "
            "these EXACT figures for the owner without inventing anything:\n"
            f"{data['forecast']}\nSegments: {seg}\n"
            f"Restock needed: {[r['name'] for r in data['restock']]}\n"
            f"Slow movers: {[s['name'] for s in data['slow_moving'][:5]]}"
        )
        text = _generate_text(prompt).strip()
        return (text or template), (not bool(text))
    except Exception:  # noqa: BLE001
        return template, True
