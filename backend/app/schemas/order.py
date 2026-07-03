from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=500)
    variant_label: str | None = None


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = None
    address: str = Field(min_length=5)
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    variant_label: str | None
    quantity: int
    unit_price: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    phone: str
    email: str | None
    address: str
    total_amount: int
    status: str
    razorpay_order_id: str | None
    razorpay_payment_id: str | None
    created_at: datetime
    items: list[OrderItemOut]


class OrderCreateResponse(BaseModel):
    order_id: int
    razorpay_order_id: str
    amount: int  # paise, as Razorpay expects
    currency: str
    key_id: str
    mock: bool


class PaymentVerifyRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerifyResponse(BaseModel):
    order_id: int
    status: str
