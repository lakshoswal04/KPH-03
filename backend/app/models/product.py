from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    sub_brand: Mapped[str] = mapped_column(String(30), index=True)
    tab: Mapped[str] = mapped_column(String(30), index=True)
    description: Mapped[str] = mapped_column(Text)
    features: Mapped[list[str]] = mapped_column(JSON, default=list)
    price_low: Mapped[int] = mapped_column(Integer)
    price_high: Mapped[int] = mapped_column(Integer)
    price_unit: Mapped[str] = mapped_column(String(10), default="L")
    # Purchasable pack/size options: list of {"label": str, "price": int}.
    variants: Mapped[list] = mapped_column(JSON, default=list)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"), nullable=True, index=True
    )

    category = relationship("Category", back_populates="products")
