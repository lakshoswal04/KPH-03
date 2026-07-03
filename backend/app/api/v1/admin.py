import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order
from app.models.product import Product
from app.schemas.admin import (
    ENQUIRY_STATUSES,
    ORDER_STATUSES,
    SURVEY_STATUSES,
    AdminEnquiryOut,
    StatusUpdate,
)
from app.schemas.enquiry import SurveyOut
from app.schemas.order import OrderOut
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.image_service import save_product_image

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "product"


def _set_status(row, new_status: str, allowed: list[str]):
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")
    row.status = new_status


# ---- Enquiries ----
@router.get("/enquiries", response_model=list[AdminEnquiryOut])
def list_enquiries(db: Session = Depends(get_db)) -> list[AdminEnquiryOut]:
    rows = db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()
    names = {
        p.id: p.name
        for p in db.query(Product).filter(
            Product.id.in_([r.product_id for r in rows if r.product_id])
        )
    }
    out = []
    for r in rows:
        item = AdminEnquiryOut.model_validate(r)
        item.product_name = names.get(r.product_id) if r.product_id else None
        out.append(item)
    return out


@router.patch("/enquiries/{enquiry_id}", response_model=AdminEnquiryOut)
def update_enquiry_status(
    enquiry_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
) -> AdminEnquiryOut:
    row = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    _set_status(row, payload.status, ENQUIRY_STATUSES)
    db.commit()
    db.refresh(row)
    return AdminEnquiryOut.model_validate(row)


# ---- Surveys ----
@router.get("/surveys", response_model=list[SurveyOut])
def list_surveys(db: Session = Depends(get_db)) -> list[SurveyOut]:
    rows = db.query(Survey).order_by(Survey.created_at.desc()).all()
    return [SurveyOut.model_validate(r) for r in rows]


@router.patch("/surveys/{survey_id}", response_model=SurveyOut)
def update_survey_status(
    survey_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
) -> SurveyOut:
    row = db.query(Survey).filter(Survey.id == survey_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    _set_status(row, payload.status, SURVEY_STATUSES)
    db.commit()
    db.refresh(row)
    return SurveyOut.model_validate(row)


# ---- Orders ----
@router.get("/orders", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)) -> list[OrderOut]:
    rows = (
        db.query(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderOut.model_validate(r) for r in rows]


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(
    order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
) -> OrderOut:
    row = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Order not found")
    _set_status(row, payload.status, ORDER_STATUSES)
    db.commit()
    db.refresh(row)
    return OrderOut.model_validate(row)


# ---- Product management ----
@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)) -> list[ProductOut]:
    rows = db.query(Product).order_by(Product.tab, Product.name).all()
    return [ProductOut.model_validate(r) for r in rows]


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductOut:
    slug = _slugify(payload.name)
    if db.query(Product).filter(Product.slug == slug).first():
        raise HTTPException(status_code=400, detail="A product with this name already exists")
    product = Product(
        slug=slug,
        name=payload.name,
        sub_brand=payload.sub_brand,
        tab=payload.tab,
        description=payload.description,
        features=payload.features,
        price_low=payload.price_low,
        price_high=payload.price_high,
        price_unit=payload.price_unit,
        variants=[v.model_dump() for v in payload.variants],
        category_id=payload.category_id,
        image_url=None,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    data = payload.model_dump(exclude_unset=True)
    if "variants" in data and data["variants"] is not None:
        data["variants"] = [v for v in data["variants"]]  # already dicts from model_dump
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.post("/products/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    product.image_url = save_product_image(file.filename or "image.png", data)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)
