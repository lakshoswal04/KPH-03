from datetime import datetime

from pydantic import BaseModel, ConfigDict

ENQUIRY_STATUSES = ["new", "assigned", "in_progress", "replied", "closed", "archived"]
SURVEY_STATUSES = [
    "pending", "assigned", "scheduled", "in_progress", "completed", "cancelled",
]
# Order fulfilment lifecycle (payment state lives on the Payment model).
ORDER_STATUSES = [
    "pending", "confirmed", "packed", "shipped", "out_for_delivery",
    "delivered", "cancelled", "refunded",
]
# Guarded forward transitions; cancellation/refund allowed from most states.
ORDER_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["packed", "cancelled", "refunded"],
    "packed": ["shipped", "cancelled", "refunded"],
    "shipped": ["out_for_delivery", "refunded"],
    "out_for_delivery": ["delivered", "refunded"],
    "delivered": ["refunded"],
    "cancelled": [],
    "refunded": [],
}


class StatusUpdate(BaseModel):
    status: str


class AdminEnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None
    message: str
    product_id: int | None
    product_name: str | None = None
    budget: str | None = None
    source: str = "website"
    status: str
    assignee_id: int | None = None
    reply: str | None = None
    archived: bool = False
    followups: list = []
    created_at: datetime


class EnquiryUpdate(BaseModel):
    status: str | None = None
    assignee_id: int | None = None
    reply: str | None = None
    archived: bool | None = None


class FollowupIn(BaseModel):
    note: str


class SurveyUpdate(BaseModel):
    status: str | None = None
    assignee_id: int | None = None
    scheduled_at: datetime | None = None
    notes: str | None = None


class BulkUpdate(BaseModel):
    ids: list[int]
    # Any subset of these product fields to apply to all selected ids.
    is_active: bool | None = None
    is_featured: bool | None = None
    category_id: int | None = None
    brand_id: int | None = None
    price_delta_pct: int | None = None  # e.g. +10 raises price_low/high by 10%


class BulkDelete(BaseModel):
    ids: list[int]


class CategoryUpsert(BaseModel):
    slug: str | None = None
    name: str
    emoji: str = "📦"
    description: str = ""
    accent: str = "#E8590C"
    background: str = "#FFF8EF"
    count_label: str = ""
    sort_order: int = 0
    is_active: bool = True


class BrandUpsert(BaseModel):
    slug: str | None = None
    name: str
    logo_url: str | None = None
    description: str | None = None
    sort_order: int = 0


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    logo_url: str | None
    description: str | None
    sort_order: int
