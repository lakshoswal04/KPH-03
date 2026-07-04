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

from app.models.category import Category
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


def revenue_series(db: Session, days: int = 60, forecast_days: int = 30) -> list[dict]:
    """Continuous daily revenue for the last `days`, plus a `forecast_days` tail
    projected from the actual trend. Each point: {date, actual, forecast}."""
    start = (_now() - timedelta(days=days)).date()
    rows = dict(
        db.query(func.date_trunc("day", Order.created_at), func.sum(Order.total_amount))
        .filter(Order.status.in_(PAID), Order.created_at >= _now() - timedelta(days=days))
        .group_by(func.date_trunc("day", Order.created_at))
        .all()
    )
    by_day = {d.date() if hasattr(d, "date") else d: int(v or 0) for d, v in rows.items()}

    actual: list[int] = []
    series: list[dict] = []
    for i in range(days + 1):
        day = start + timedelta(days=i)
        val = by_day.get(day, 0)
        actual.append(val)
        series.append({"date": day.strftime("%d %b"), "actual": val, "forecast": None})

    # Linear trend for the forecast tail.
    ys = [float(v) for v in actual]
    n = len(ys)
    if n >= 2:
        xs = list(range(n))
        mx, my = sum(xs) / n, sum(ys) / n
        denom = sum((x - mx) ** 2 for x in xs) or 1
        slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom
        intercept = my - slope * mx
        last_actual = series[-1]
        last_actual["forecast"] = last_actual["actual"]  # connect the two lines
        last_day = start + timedelta(days=days)
        for i in range(1, forecast_days + 1):
            day = last_day + timedelta(days=i)
            proj = max(0, round(intercept + slope * (n - 1 + i)))
            series.append({"date": day.strftime("%d %b"), "actual": None, "forecast": proj})
    return series


def kpis(db: Session) -> dict:
    """Headline commerce KPIs over the last 30 days vs the prior 30 (real orders)."""
    now = _now()
    this_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)

    def window(a: datetime, b: datetime) -> tuple[int, int]:
        rev, cnt = (
            db.query(func.coalesce(func.sum(Order.total_amount), 0), func.count(Order.id))
            .filter(Order.status.in_(PAID), Order.created_at >= a, Order.created_at < b)
            .one()
        )
        return int(rev or 0), int(cnt or 0)

    rev_now, orders_now = window(this_start, now)
    rev_prev, orders_prev = window(prev_start, this_start)
    growth = round((rev_now - rev_prev) / rev_prev * 100) if rev_prev else None
    aov = round(rev_now / orders_now) if orders_now else 0
    return {
        "revenue_30d": rev_now,
        "revenue_prev_30d": rev_prev,
        "growth_pct": growth,
        "orders_30d": orders_now,
        "orders_prev_30d": orders_prev,
        "aov": aov,
    }


def category_performance(db: Session, days: int = 90) -> list[dict]:
    """Revenue and units sold by product category over the window."""
    start = _now() - timedelta(days=days)
    rows = (
        db.query(
            Category.name,
            func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.quantity), 0),
        )
        .join(Product, Product.category_id == Category.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(PAID), Order.created_at >= start)
        .group_by(Category.name)
        .all()
    )
    out = [
        {"category": name, "revenue": int(rev or 0), "units": int(units or 0)}
        for name, rev, units in rows
    ]
    return sorted(out, key=lambda d: d["revenue"], reverse=True)


def top_products(db: Session, days: int = 90, limit: int = 8) -> list[dict]:
    """Best products by revenue over the window."""
    start = _now() - timedelta(days=days)
    rows = (
        db.query(
            Product.name,
            func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.quantity), 0),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(PAID), Order.created_at >= start)
        .group_by(Product.name)
        .order_by(func.sum(OrderItem.unit_price * OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        {"name": name, "revenue": int(rev or 0), "units": int(units or 0)}
        for name, rev, units in rows
    ]


def inventory_value(db: Session) -> dict:
    """Total catalogue stock value and the value tied up in slow-moving stock."""
    products = db.query(Product).filter(Product.is_active.is_(True)).all()
    total = sum((p.stock or 0) * (p.price_low or 0) for p in products)
    slow = {s["id"] for s in slow_moving(db, limit=10)}
    at_risk = sum(
        (p.stock or 0) * (p.price_low or 0) for p in products if p.id in slow
    )
    return {"total_value": int(total), "at_risk_value": int(at_risk),
            "skus": len(products)}


def compute_all(db: Session) -> dict:
    return {
        "kpis": kpis(db),
        "forecast": sales_forecast(db),
        "revenue_series": revenue_series(db),
        "category_performance": category_performance(db),
        "top_products": top_products(db),
        "inventory_value": inventory_value(db),
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
    k = data.get("kpis", {})
    cats = data.get("category_performance", [])
    inv = data.get("inventory_value", {})
    top_cat = cats[0]["category"] if cats else None
    growth = k.get("growth_pct")
    growth_txt = (
        f"Revenue over the last 30 days is ₹{k.get('revenue_30d', 0):,} "
        f"({'up' if (growth or 0) >= 0 else 'down'} {abs(growth)}% vs the prior month). "
        if growth is not None else
        f"Revenue over the last 30 days is ₹{k.get('revenue_30d', 0):,}. "
    )
    template = (
        f"{growth_txt}"
        f"Projected revenue for the next 30 days is about ₹{fc['next_30d']:,} "
        f"({fc['method'].replace('_', ' ')}, {fc['confidence']} confidence). "
        f"{f'{top_cat} is your top-selling category. ' if top_cat else ''}"
        f"You have {seg['returning']} returning and {seg['new']} new buyers"
        f"{f', with {seg['dormant']} dormant (re-engage them)' if seg['dormant'] else ''}. "
        f"{len(data['restock'])} best-sellers need restocking and "
        f"₹{inv.get('at_risk_value', 0):,} is tied up in slow-moving stock."
    )
    from app.core.config import settings

    if not settings.gemini_enabled:
        return template, True
    try:
        from app.services.ai_service import _generate_text

        prompt = (
            "You are a retail analyst for a paint shop in Pune. In 4-5 concise, plain-language "
            "sentences, brief the owner on these EXACT figures without inventing anything. "
            "Highlight the revenue trend, forecast, top category, customer mix, and one clear "
            "action to take:\n"
            f"Last 30d KPIs: {k}\nForecast: {fc}\n"
            f"Category performance: {[(c['category'], c['revenue']) for c in cats[:5]]}\n"
            f"Segments: {seg}\nInventory value: {inv}\n"
            f"Restock needed: {[r['name'] for r in data['restock']]}\n"
            f"Slow movers: {[s['name'] for s in data['slow_moving'][:5]]}"
        )
        text = _generate_text(prompt).strip()
        return (text or template), (not bool(text))
    except Exception:  # noqa: BLE001
        return template, True
