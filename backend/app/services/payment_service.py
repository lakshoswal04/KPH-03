import hashlib
import hmac
import uuid

from app.core.config import settings

MOCK_SIGNATURE = "mock_signature"


def _client():
    import razorpay

    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount_rupees: int, receipt: str) -> dict:
    """Create a Razorpay order (amount in paise). Falls back to a mock order in dev
    when no real keys are configured, so the checkout flow stays testable."""
    amount_paise = amount_rupees * 100
    if not settings.razorpay_enabled:
        return {
            "id": f"order_mock_{uuid.uuid4().hex[:14]}",
            "amount": amount_paise,
            "currency": "INR",
            "mock": True,
        }
    order = _client().order.create(
        {"amount": amount_paise, "currency": "INR", "receipt": receipt}
    )
    return {"id": order["id"], "amount": order["amount"], "currency": order["currency"], "mock": False}


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Never trust the frontend: recompute the HMAC exactly as Razorpay documents."""
    if not settings.razorpay_enabled:
        return signature == MOCK_SIGNATURE
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    if not settings.razorpay_enabled:
        return signature == MOCK_SIGNATURE
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
