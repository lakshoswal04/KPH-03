from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    emoji: str
    description: str
    accent: str
    background: str
    count_label: str
    sort_order: int


class VariantOut(BaseModel):
    label: str
    price: int


class FaqItem(BaseModel):
    q: str
    a: str


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    sub_brand: str
    tab: str
    description: str
    features: list[str]
    price_low: int
    price_high: int
    price_unit: str
    variants: list[VariantOut]
    image_url: str | None
    category_id: int | None

    # ---- Extended catalogue fields (populated only from official sources) ----
    brand_id: int | None = None
    summary: str | None = None
    benefits: list[str] = []
    suitable_surfaces: list[str] = []
    uses: list[str] = []
    coverage: str | None = None
    finish: str | None = None
    drying_time: str | None = None
    application_method: str | None = None
    coats: str | None = None
    pack_sizes: list[str] = []
    interior_exterior: str | None = None
    tech_specs: dict = {}
    faqs: list[FaqItem] = []
    maintenance: str | None = None
    safety_tips: str | None = None
    images: list[str] = []
    recommended_primer_id: int | None = None
    recommended_putty_id: int | None = None
    related_product_ids: list[int] = []
    seo_title: str | None = None
    seo_description: str | None = None
    sku: str | None = None
    price: int | None = None
    stock: int = 0
    reserved: int = 0
    low_stock_threshold: int = 5
    is_active: bool = True
    is_featured: bool = False
    available_stock: int = 0


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int


class VariantIn(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    price: int = Field(ge=0)


class _ProductExtra(BaseModel):
    """Optional extended catalogue/commerce fields shared by create + update."""

    image_url: str | None = Field(default=None, max_length=500)
    brand_id: int | None = None
    summary: str | None = Field(default=None, max_length=400)
    benefits: list[str] | None = None
    suitable_surfaces: list[str] | None = None
    uses: list[str] | None = None
    coverage: str | None = Field(default=None, max_length=120)
    finish: str | None = Field(default=None, max_length=60)
    drying_time: str | None = Field(default=None, max_length=120)
    application_method: str | None = Field(default=None, max_length=120)
    coats: str | None = Field(default=None, max_length=40)
    pack_sizes: list[str] | None = None
    interior_exterior: str | None = Field(default=None, max_length=20)
    tech_specs: dict | None = None
    faqs: list[FaqItem] | None = None
    maintenance: str | None = None
    safety_tips: str | None = None
    images: list[str] | None = None
    recommended_primer_id: int | None = None
    recommended_putty_id: int | None = None
    related_product_ids: list[int] | None = None
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)
    sku: str | None = Field(default=None, max_length=60)
    price: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductCreate(_ProductExtra):
    name: str = Field(min_length=2, max_length=120)
    sub_brand: str = Field(min_length=1, max_length=30)
    tab: str = Field(min_length=2, max_length=30)
    description: str = Field(min_length=2)
    features: list[str] = Field(default_factory=list)
    price_low: int = Field(ge=0)
    price_high: int = Field(ge=0)
    price_unit: str = Field(default="L", max_length=10)
    variants: list[VariantIn] = Field(default_factory=list)
    category_id: int | None = None


class ProductUpdate(_ProductExtra):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    sub_brand: str | None = Field(default=None, min_length=1, max_length=30)
    tab: str | None = Field(default=None, min_length=2, max_length=30)
    description: str | None = Field(default=None, min_length=2)
    features: list[str] | None = None
    price_low: int | None = Field(default=None, ge=0)
    price_high: int | None = Field(default=None, ge=0)
    price_unit: str | None = Field(default=None, max_length=10)
    variants: list[VariantIn] | None = None
    category_id: int | None = None
