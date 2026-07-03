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


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int


class VariantIn(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    price: int = Field(ge=0)


class ProductCreate(BaseModel):
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


class ProductUpdate(BaseModel):
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
