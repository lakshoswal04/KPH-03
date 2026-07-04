from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    # discount_type: "percent" | "flat"
    discount_type: Mapped[str] = mapped_column(String(10), default="percent")
    value: Mapped[int] = mapped_column(Integer)  # percent (0-100) or rupees
    min_order: Mapped[int] = mapped_column(Integer, default=0)  # rupees
    max_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)  # cap, rupees
    expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
