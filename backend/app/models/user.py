from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(200))
    # Customer accounts default to non-admin; admins are provisioned explicitly
    # via create_admin.py (is_admin=True).
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    # Admin-only free-text notes on a customer, and a saved address book.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    addresses: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
