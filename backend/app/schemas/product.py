from pydantic import BaseModel, ConfigDict


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
