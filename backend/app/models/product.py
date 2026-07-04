from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
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

    # ---- Extended catalogue fields (Phase 0). All nullable / defaulted so the
    # existing 32 seeded rows migrate cleanly; populated only from official
    # Birla Opus sources — never invented (see scripts/fetch_birla_specs.py). ----
    brand_id: Mapped[int | None] = mapped_column(
        ForeignKey("brands.id"), nullable=True, index=True
    )
    summary: Mapped[str | None] = mapped_column(String(400), nullable=True)
    benefits: Mapped[list] = mapped_column(JSON, default=list)
    suitable_surfaces: Mapped[list] = mapped_column(JSON, default=list)
    uses: Mapped[list] = mapped_column(JSON, default=list)
    coverage: Mapped[str | None] = mapped_column(String(120), nullable=True)
    finish: Mapped[str | None] = mapped_column(String(60), nullable=True)
    drying_time: Mapped[str | None] = mapped_column(String(120), nullable=True)
    application_method: Mapped[str | None] = mapped_column(String(120), nullable=True)
    coats: Mapped[str | None] = mapped_column(String(40), nullable=True)
    pack_sizes: Mapped[list] = mapped_column(JSON, default=list)
    interior_exterior: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tech_specs: Mapped[dict] = mapped_column(JSON, default=dict)
    faqs: Mapped[list] = mapped_column(JSON, default=list)  # [{"q":..,"a":..}]
    maintenance: Mapped[str | None] = mapped_column(Text, nullable=True)
    safety_tips: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list] = mapped_column(JSON, default=list)  # extra image urls
    recommended_primer_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    recommended_putty_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    related_product_ids: Mapped[list] = mapped_column(JSON, default=list)
    seo_title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)

    # ---- Commerce / inventory ----
    sku: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)  # hardware fixed price
    stock: Mapped[int] = mapped_column(Integer, default=0)
    reserved: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")

    @property
    def available_stock(self) -> int:
        return max(0, (self.stock or 0) - (self.reserved or 0))
