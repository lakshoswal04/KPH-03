from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = None
    message: str = Field(min_length=5)
    product_id: int | None = None


class EnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None
    message: str
    product_id: int | None
    status: str
    created_at: datetime


class SurveyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5)
    locality: str = Field(min_length=2, max_length=120)
    property_type: str = Field(min_length=2, max_length=40)
    preferred_date: str | None = None
    notes: str | None = None


class SurveyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    address: str
    locality: str
    property_type: str
    preferred_date: str | None
    notes: str | None
    status: str
    created_at: datetime
