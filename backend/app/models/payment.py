from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    method: Mapped[str | None] = mapped_column(String(30), nullable=True)  # razorpay/upi/card
    amount: Mapped[int] = mapped_column(Integer)  # rupees
    gst_amount: Mapped[int] = mapped_column(Integer, default=0)
    # status: created | captured | failed | refunded | partially_refunded
    status: Mapped[str] = mapped_column(String(20), default="created", index=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    refund_amount: Mapped[int] = mapped_column(Integer, default=0)
    refund_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subtotal: Mapped[int] = mapped_column(Integer, default=0)
    gst_amount: Mapped[int] = mapped_column(Integer, default=0)
    delivery_charge: Mapped[int] = mapped_column(Integer, default=0)
    discount: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
