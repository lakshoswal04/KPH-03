from datetime import datetime

from pydantic import BaseModel, ConfigDict

ENQUIRY_STATUSES = ["new", "in_progress", "handled", "closed"]
SURVEY_STATUSES = ["new", "scheduled", "done", "cancelled"]
ORDER_STATUSES = ["created", "paid", "shipped", "delivered", "cancelled"]


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
    status: str
    created_at: datetime
