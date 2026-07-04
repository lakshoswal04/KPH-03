"""Knowledge base for the WhatsApp bot. Every answer is grounded in the database
or the fixed business facts below — the bot must never invent prices, policies,
availability, or products. Functions return None/empty when there is no grounded
answer, which signals the bot to escalate to a human."""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.models.product import Product

BUSINESS = {
    "name": "Kamlesh Paints & Hardware",
    "phone": "+91 98504 20090",
    "address": "FC Road, Dnyaneshwar Paduka Chowk, Shivajinagar, Pune 411005",
    "hours": "Mon–Sat 9:30am–8:30pm, Sun 10am–6pm",
    "delivery": "Free delivery across Pune on orders above ₹2,000; ₹99 otherwise.",
}

STOPWORDS = {"the", "a", "an", "for", "of", "to", "me", "i", "is", "and", "paint", "price", "cost"}


def search_products(query: str, db: Session, limit: int = 5) -> list[Product]:
    """Match products by name/brand/description tokens; drops noise words."""
    tokens = [t for t in query.lower().split() if t not in STOPWORDS and len(t) > 2]
    q = db.query(Product).filter(Product.is_active.is_(True))
    if tokens:
        conds = []
        for t in tokens:
            like = f"%{t}%"
            conds.append(Product.name.ilike(like))
            conds.append(Product.sub_brand.ilike(like))
            conds.append(Product.description.ilike(like))
        q = q.filter(or_(*conds))
    return q.limit(limit).all()


def product_answer(query: str, db: Session) -> str | None:
    products = search_products(query, db)
    if not products:
        return None
    lines = []
    for p in products[:4]:
        price = f"from ₹{p.price_low}" if p.price_low else "price on request"
        stock = "in stock" if p.available_stock > 0 else "currently out of stock"
        line = f"• *{p.name}* ({p.sub_brand}) — {price}, {stock}"
        if p.coverage:
            line += f"\n   Coverage: {p.coverage}"
        if p.finish:
            line += f" · Finish: {p.finish}"
        lines.append(line)
    return "Here's what we have:\n" + "\n".join(lines)


def order_status_answer(phone: str, db: Session) -> str | None:
    order = (
        db.query(Order)
        .filter(Order.phone.like(f"%{phone[-10:]}%"))
        .order_by(Order.created_at.desc())
        .first()
    )
    if order is None:
        return None
    return (
        f"Your most recent order *#{order.id}* is *{order.status.replace('_', ' ')}* "
        f"(₹{order.total_amount:,}). We'll keep you posted!"
    )


def static_answer(intent: str) -> str | None:
    if intent == "contact":
        return f"📍 {BUSINESS['address']}\n📞 {BUSINESS['phone']}\n🕐 {BUSINESS['hours']}"
    if intent == "delivery":
        return BUSINESS["delivery"]
    if intent == "hours":
        return f"We're open {BUSINESS['hours']}."
    if intent == "greeting":
        return (
            f"Hi! 👋 Welcome to {BUSINESS['name']}, your Birla Opus dealer in Pune. "
            "Ask me about products, prices, coverage, delivery, or book a free site survey."
        )
    return None
