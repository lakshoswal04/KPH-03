from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderCreateResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)
from app.services.email_service import send_notification
from app.services.payment_service import (
    create_razorpay_order,
    verify_payment_signature,
    verify_webhook_signature,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderCreateResponse, status_code=201)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> OrderCreateResponse:
    product_ids = [item.product_id for item in payload.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    by_id = {p.id: p for p in products}
    missing = set(product_ids) - set(by_id)
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown product ids: {sorted(missing)}")

    def unit_price_for(product: Product, variant_label: str | None) -> int:
        """Server-authoritative price: resolve the chosen pack from the product's
        own variants, never from the client. Falls back to base price_low."""
        if variant_label:
            for variant in product.variants or []:
                if variant.get("label") == variant_label:
                    return int(variant["price"])
        return product.price_low

    # Prices are always taken from the database, never from the client.
    line_prices = {
        id(item): unit_price_for(by_id[item.product_id], item.variant_label)
        for item in payload.items
    }
    total = sum(line_prices[id(item)] * item.quantity for item in payload.items)

    order = Order(
        user_id=current.id,
        customer_name=payload.customer_name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        total_amount=total,
        status="created",
    )
    db.add(order)
    db.flush()
    for item in payload.items:
        product = by_id[item.product_id]
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                variant_label=item.variant_label,
                quantity=item.quantity,
                unit_price=line_prices[id(item)],
            )
        )

    rzp = create_razorpay_order(total, receipt=f"kph-order-{order.id}")
    order.razorpay_order_id = rzp["id"]
    db.commit()

    return OrderCreateResponse(
        order_id=order.id,
        razorpay_order_id=rzp["id"],
        amount=rzp["amount"],
        currency=rzp["currency"],
        key_id=settings.RAZORPAY_KEY_ID,
        mock=rzp["mock"],
    )


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> PaymentVerifyResponse:
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if order is None or order.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if not verify_payment_signature(
        payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
    ):
        order.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    order.status = "paid"
    order.razorpay_payment_id = payload.razorpay_payment_id
    db.commit()
    send_notification("Order paid", f"Order #{order.id} — ₹{order.total_amount} — {order.customer_name}")
    return PaymentVerifyResponse(order_id=order.id, status=order.status)


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    body = await request.body()
    if not verify_webhook_signature(body, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    event = await request.json()
    if event.get("event") == "payment.captured":
        entity = event["payload"]["payment"]["entity"]
        order = (
            db.query(Order)
            .filter(Order.razorpay_order_id == entity.get("order_id"))
            .first()
        )
        if order is not None and order.status != "paid":
            order.status = "paid"
            order.razorpay_payment_id = entity.get("id")
            db.commit()
    return {"status": "ok"}
