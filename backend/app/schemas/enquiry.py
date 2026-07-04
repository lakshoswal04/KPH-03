from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = None
    message: str = Field(min_length=5)
    product_id: int | None = None
    product_ids: list[int] = Field(default_factory=list)
    budget: str | None = Field(default=None, max_length=60)
    source: str = Field(default="website", max_length=30)


class EnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None
    message: str
    product_id: int | None
    budget: str | None = None
    source: str = "website"
    status: str
    created_at: datetime


class SurveyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = None
    address: str = Field(min_length=5)
    locality: str = Field(min_length=2, max_length=120)
    property_type: str = Field(min_length=2, max_length=40)
    preferred_date: str | None = None
    preferred_time: str | None = None
    notes: str | None = None
    reference_images: list[str] = Field(default_factory=list)


class SurveyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None = None
    address: str
    locality: str
    property_type: str
    preferred_date: str | None
    preferred_time: str | None = None
    notes: str | None
    reference_images: list[str] = []
    status: str
    assignee_id: int | None = None
    scheduled_at: datetime | None = None
    created_at: datetime
