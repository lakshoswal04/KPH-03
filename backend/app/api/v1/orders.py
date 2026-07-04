from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderCreateResponse,
    OrderOut,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    QuoteRequest,
    QuoteResponse,
)
from app.services.checkout_service import (
    commit_stock_sale,
    compute_totals,
    reserve_stock,
)
from app.services.email_service import send_customer_email, send_notification
from app.services.invoice_service import generate_invoice
from app.services.payment_service import (
    create_razorpay_order,
    verify_payment_signature,
    verify_webhook_signature,
)
from app.services.whatsapp_service import send_text

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/quote", response_model=QuoteResponse)
def quote(payload: QuoteRequest, db: Session = Depends(get_db)) -> QuoteResponse:
    """Price a cart (GST, delivery, coupon) without creating an order."""
    t = compute_totals(payload.items, payload.coupon_code, db)
    return QuoteResponse(
        subtotal=t.subtotal, discount=t.discount, gst_amount=t.gst_amount,
        delivery_charge=t.delivery_charge, total=t.total,
        coupon_code=t.coupon_code, coupon_message=t.coupon_message, warnings=t.warnings,
    )


@router.get("/mine", response_model=list[OrderOut])
def my_orders(
    db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> list[OrderOut]:
    rows = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.user_id == current.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderOut.model_validate(r) for r in rows]


@router.post("", response_model=OrderCreateResponse, status_code=201)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> OrderCreateResponse:
    # Idempotency: return the existing order for a repeated submission.
    if payload.idempotency_key:
        existing = (
            db.query(Order)
            .filter(
                Order.user_id == current.id,
                Order.idempotency_key == payload.idempotency_key,
            )
            .first()
        )
        if existing and existing.razorpay_order_id:
            return OrderCreateResponse(
                order_id=existing.id,
                razorpay_order_id=existing.razorpay_order_id,
                amount=existing.total_amount * 100,
                currency="INR",
                key_id=settings.RAZORPAY_KEY_ID,
                mock=not settings.razorpay_enabled,
            )

    totals = compute_totals(payload.items, payload.coupon_code, db)

    order = Order(
        user_id=current.id,
        customer_name=payload.customer_name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        subtotal=totals.subtotal,
        gst_amount=totals.gst_amount,
        delivery_charge=totals.delivery_charge,
        discount=totals.discount,
        coupon_code=totals.coupon_code,
        total_amount=totals.total,
        payment_method=payload.payment_method,
        idempotency_key=payload.idempotency_key,
        status="pending",
    )
    db.add(order)
    db.flush()

    for line in totals.lines:
        db.add(OrderItem(
            order_id=order.id, product_id=line.product.id, product_name=line.product.name,
            variant_label=line.variant_label, quantity=line.quantity, unit_price=line.unit_price,
        ))

    # Hold stock so two customers can't buy the last unit.
    reserve_stock(totals.lines, order.id, db)

    # Count coupon usage.
    if totals.coupon_code:
        from app.models.coupon import Coupon

        c = db.query(Coupon).filter(Coupon.code == totals.coupon_code).first()
        if c:
            c.used_count += 1

    rzp = create_razorpay_order(totals.total, receipt=f"kph-order-{order.id}")
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


def _finalize_paid(order: Order, payment_id: str | None, db: Session) -> str | None:
    """Shared success path: mark paid, deduct stock, record payment, invoice, notify."""
    order.status = "confirmed"
    order.razorpay_payment_id = payment_id
    commit_stock_sale(order, db)
    db.add(Payment(
        order_id=order.id, method=order.payment_method or "razorpay",
        amount=order.total_amount, gst_amount=order.gst_amount,
        status="captured", razorpay_payment_id=payment_id,
    ))
    invoice = generate_invoice(order, db)
    db.commit()

    msg = (
        f"Order #{order.id} confirmed — ₹{order.total_amount:,}. "
        f"Invoice {invoice.number}. Thank you for shopping with Kamlesh Paints!"
    )
    send_notification("Order paid", f"Order #{order.id} — ₹{order.total_amount:,} — {order.customer_name}")
    send_customer_email(order.email, f"Order #{order.id} confirmed", f"{msg}\nInvoice: {invoice.pdf_url}")
    send_text(order.phone, msg)
    return invoice.pdf_url


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> PaymentVerifyResponse:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == payload.order_id)
        .first()
    )
    if order is None or order.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.status == "confirmed":
        # Already finalized — idempotent no-op.
        return PaymentVerifyResponse(order_id=order.id, status=order.status, invoice_url=None)
    if not verify_payment_signature(
        payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
    ):
        order.status = "cancelled"
        from app.services.checkout_service import release_stock

        release_stock(order, db)
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    invoice_url = _finalize_paid(order, payload.razorpay_payment_id, db)
    return PaymentVerifyResponse(order_id=order.id, status=order.status, invoice_url=invoice_url)


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
            .options(selectinload(Order.items))
            .filter(Order.razorpay_order_id == entity.get("order_id"))
            .first()
        )
        if order is not None and order.status not in ("confirmed", "delivered", "refunded"):
            _finalize_paid(order, entity.get("id"), db)
    return {"status": "ok"}
