import csv
import io
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.brand import Brand
from app.models.category import Category
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order
from app.models.product import Product
from app.schemas.admin import (
    ENQUIRY_STATUSES,
    ORDER_STATUSES,
    ORDER_TRANSITIONS,
    SURVEY_STATUSES,
    AdminEnquiryOut,
    BrandOut,
    BrandUpsert,
    BulkDelete,
    BulkUpdate,
    CategoryUpsert,
    EnquiryUpdate,
    FollowupIn,
    StatusUpdate,
    SurveyUpdate,
)
from app.schemas.enquiry import SurveyOut
from app.schemas.order import OrderOut
from app.schemas.product import CategoryOut, ProductCreate, ProductOut, ProductUpdate
from app.services.checkout_service import release_stock
from app.services.email_service import send_customer_email
from app.services.image_service import save_product_image

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "item"


def _csv_response(headers: list[str], rows: list[list], filename: str) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==================== Enquiries ====================
@router.get("/enquiries", response_model=list[AdminEnquiryOut])
def list_enquiries(
    search: str | None = None,
    status: str | None = None,
    archived: bool | None = None,
    db: Session = Depends(get_db),
) -> list[AdminEnquiryOut]:
    q = db.query(Enquiry)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Enquiry.name.ilike(like), Enquiry.phone.ilike(like), Enquiry.message.ilike(like)))
    if status:
        q = q.filter(Enquiry.status == status)
    if archived is not None:
        q = q.filter(Enquiry.archived.is_(archived))
    rows = q.order_by(Enquiry.created_at.desc()).all()
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
def update_enquiry(
    enquiry_id: int, payload: EnquiryUpdate, db: Session = Depends(get_db)
) -> AdminEnquiryOut:
    row = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if payload.status is not None:
        if payload.status not in ENQUIRY_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {ENQUIRY_STATUSES}")
        row.status = payload.status
    if payload.assignee_id is not None:
        row.assignee_id = payload.assignee_id
        if row.status == "new":
            row.status = "assigned"
    if payload.reply is not None:
        row.reply = payload.reply
        row.status = "replied"
        send_customer_email(row.email, "Re: your enquiry", payload.reply)
    if payload.archived is not None:
        row.archived = payload.archived
        if payload.archived:
            row.status = "archived"
    db.commit()
    db.refresh(row)
    return AdminEnquiryOut.model_validate(row)


@router.post("/enquiries/{enquiry_id}/followup", response_model=AdminEnquiryOut)
def add_followup(
    enquiry_id: int, payload: FollowupIn, db: Session = Depends(get_db)
) -> AdminEnquiryOut:
    row = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    row.followups = (row.followups or []) + [
        {"at": datetime.now(timezone.utc).isoformat(), "note": payload.note}
    ]
    db.commit()
    db.refresh(row)
    return AdminEnquiryOut.model_validate(row)


@router.get("/enquiries/export")
def export_enquiries(db: Session = Depends(get_db)) -> Response:
    rows = db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()
    return _csv_response(
        ["id", "name", "phone", "email", "budget", "source", "status", "message", "created_at"],
        [[r.id, r.name, r.phone, r.email or "", r.budget or "", r.source, r.status,
          r.message.replace("\n", " "), r.created_at.isoformat()] for r in rows],
        "enquiries.csv",
    )


# ==================== Surveys ====================
@router.get("/surveys", response_model=list[SurveyOut])
def list_surveys(status: str | None = None, db: Session = Depends(get_db)) -> list[SurveyOut]:
    q = db.query(Survey)
    if status:
        q = q.filter(Survey.status == status)
    rows = q.order_by(Survey.created_at.desc()).all()
    return [SurveyOut.model_validate(r) for r in rows]


@router.patch("/surveys/{survey_id}", response_model=SurveyOut)
def update_survey(
    survey_id: int, payload: SurveyUpdate, db: Session = Depends(get_db)
) -> SurveyOut:
    row = db.query(Survey).filter(Survey.id == survey_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if payload.status is not None:
        if payload.status not in SURVEY_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {SURVEY_STATUSES}")
        row.status = payload.status
    if payload.assignee_id is not None:
        row.assignee_id = payload.assignee_id
        if row.status == "pending":
            row.status = "assigned"
    if payload.scheduled_at is not None:
        row.scheduled_at = payload.scheduled_at
        if row.status in ("pending", "assigned"):
            row.status = "scheduled"
    if payload.notes is not None:
        row.notes = payload.notes
    db.commit()
    db.refresh(row)
    return SurveyOut.model_validate(row)


@router.get("/surveys/export")
def export_surveys(db: Session = Depends(get_db)) -> Response:
    rows = db.query(Survey).order_by(Survey.created_at.desc()).all()
    return _csv_response(
        ["id", "name", "phone", "locality", "property_type", "preferred_date", "status", "created_at"],
        [[r.id, r.name, r.phone, r.locality, r.property_type, r.preferred_date or "",
          r.status, r.created_at.isoformat()] for r in rows],
        "surveys.csv",
    )


# ==================== Orders ====================
@router.get("/orders", response_model=list[OrderOut])
def list_orders(status: str | None = None, db: Session = Depends(get_db)) -> list[OrderOut]:
    q = db.query(Order).options(selectinload(Order.items))
    if status:
        q = q.filter(Order.status == status)
    rows = q.order_by(Order.created_at.desc()).all()
    return [OrderOut.model_validate(r) for r in rows]


@router.get("/orders/export")
def export_orders(db: Session = Depends(get_db)) -> Response:
    rows = db.query(Order).order_by(Order.created_at.desc()).all()
    return _csv_response(
        ["id", "customer", "phone", "subtotal", "discount", "gst", "delivery", "total", "status", "created_at"],
        [[r.id, r.customer_name, r.phone, r.subtotal or 0, r.discount, r.gst_amount,
          r.delivery_charge, r.total_amount, r.status, r.created_at.isoformat()] for r in rows],
        "orders.csv",
    )


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderOut:
    row = (
        db.query(Order).options(selectinload(Order.items))
        .filter(Order.id == order_id).first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderOut.model_validate(row)


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(
    order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
) -> OrderOut:
    row = (
        db.query(Order).options(selectinload(Order.items))
        .filter(Order.id == order_id).first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if payload.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {ORDER_STATUSES}")
    allowed = ORDER_TRANSITIONS.get(row.status, [])
    if payload.status != row.status and payload.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move order from '{row.status}' to '{payload.status}'. Allowed: {allowed}",
        )
    # Releasing stock when an unpaid order is cancelled.
    if payload.status == "cancelled" and row.status == "pending":
        release_stock(row, db)
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return OrderOut.model_validate(row)


# ==================== Products ====================
def _apply_product_fields(product: Product, data: dict) -> None:
    for field, value in data.items():
        if field == "faqs" and value is not None:
            product.faqs = [f if isinstance(f, dict) else f.model_dump() for f in value]
        else:
            setattr(product, field, value)


@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)) -> list[ProductOut]:
    rows = db.query(Product).order_by(Product.tab, Product.name).all()
    return [ProductOut.model_validate(r) for r in rows]


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductOut:
    slug = _slugify(payload.name)
    if db.query(Product).filter(Product.slug == slug).first():
        raise HTTPException(status_code=400, detail="A product with this name already exists")
    # Drop unset/None extras so SQLAlchemy column defaults (e.g. empty list/dict)
    # apply instead of being overwritten with NULL.
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    data["variants"] = [v for v in data.get("variants", [])]
    faqs = data.pop("faqs", None)
    product = Product(slug=slug, **data)
    if faqs:
        product.faqs = faqs
    db.add(product)
    if not product.sku:
        db.flush()  # assign product.id so we can build a stable SKU
        product.sku = f"{product.sub_brand[:3].upper()}-{product.id:04d}"
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
    _apply_product_fields(product, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return Response(status_code=204)


@router.post("/products/{product_id}/duplicate", response_model=ProductOut, status_code=201)
def duplicate_product(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    src = db.query(Product).filter(Product.id == product_id).first()
    if src is None:
        raise HTTPException(status_code=404, detail="Product not found")
    base_slug = _slugify(src.name + "-copy")
    slug = base_slug
    i = 2
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{i}"
        i += 1
    from sqlalchemy import inspect as sa_inspect

    data = {
        c.key: getattr(src, c.key)
        for c in sa_inspect(Product).mapper.column_attrs
        if c.key not in ("id", "slug", "sku")
    }
    data["name"] = f"{src.name} (Copy)"
    data["is_active"] = False
    dup = Product(slug=slug, **data)
    db.add(dup)
    db.flush()
    dup.sku = f"{dup.sub_brand[:3].upper()}-{dup.id:04d}"
    db.commit()
    db.refresh(dup)
    return ProductOut.model_validate(dup)


@router.post("/products/bulk", response_model=dict)
def bulk_update_products(payload: BulkUpdate, db: Session = Depends(get_db)) -> dict:
    products = db.query(Product).filter(Product.id.in_(payload.ids)).all()
    for p in products:
        if payload.is_active is not None:
            p.is_active = payload.is_active
        if payload.is_featured is not None:
            p.is_featured = payload.is_featured
        if payload.category_id is not None:
            p.category_id = payload.category_id
        if payload.brand_id is not None:
            p.brand_id = payload.brand_id
        if payload.price_delta_pct:
            factor = 1 + payload.price_delta_pct / 100
            p.price_low = max(0, round(p.price_low * factor))
            p.price_high = max(0, round(p.price_high * factor))
    db.commit()
    return {"updated": len(products)}


@router.post("/products/bulk-delete", response_model=dict)
def bulk_delete_products(payload: BulkDelete, db: Session = Depends(get_db)) -> dict:
    count = db.query(Product).filter(Product.id.in_(payload.ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": count}


@router.get("/products/export")
def export_products(db: Session = Depends(get_db)) -> Response:
    rows = db.query(Product).order_by(Product.id).all()
    return _csv_response(
        ["id", "slug", "sku", "name", "sub_brand", "tab", "price_low", "price_high",
         "stock", "is_active", "finish", "coverage"],
        [[p.id, p.slug, p.sku or "", p.name, p.sub_brand, p.tab, p.price_low, p.price_high,
          p.stock, p.is_active, p.finish or "", p.coverage or ""] for p in rows],
        "products.csv",
    )


@router.post("/products/import", response_model=dict)
async def import_products(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    """Update existing products by slug/sku from a CSV (name, price_low, price_high,
    stock, is_active). Only known columns are applied; unknown rows are skipped."""
    raw = (await file.read()).decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(raw))
    updated = 0
    for r in reader:
        key = (r.get("slug") or "").strip() or (r.get("sku") or "").strip()
        if not key:
            continue
        p = db.query(Product).filter(or_(Product.slug == key, Product.sku == key)).first()
        if p is None:
            continue
        for col in ("price_low", "price_high", "stock"):
            if r.get(col):
                try:
                    setattr(p, col, int(float(r[col])))
                except ValueError:
                    pass
        if r.get("is_active"):
            p.is_active = r["is_active"].strip().lower() in ("1", "true", "yes")
        if r.get("name"):
            p.name = r["name"].strip()
        updated += 1
    db.commit()
    return {"updated": updated}


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
    url = save_product_image(file.filename or "image.png", data)
    # First image becomes the primary; extras accumulate in `images`.
    if not product.image_url:
        product.image_url = url
    else:
        product.images = (product.images or []) + [url]
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...)) -> dict:
    """Upload an image and return its public URL, without attaching it to a product.

    Lets the admin add images while *creating* a product (before it exists) and
    build a multi-image gallery. Uses the same storage as product images
    (Cloudinary when configured, else the local /uploads dir)."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 8 MB)")
    url = save_product_image(file.filename or "image.png", data)
    return {"url": url}


# ==================== Categories ====================
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    rows = db.query(Category).order_by(Category.sort_order).all()
    return [CategoryOut.model_validate(r) for r in rows]


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryUpsert, db: Session = Depends(get_db)) -> CategoryOut:
    slug = payload.slug or _slugify(payload.name)
    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    cat = Category(**{**payload.model_dump(exclude={"slug"}), "slug": slug})
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int, payload: CategoryUpsert, db: Session = Depends(get_db)
) -> CategoryOut:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude={"slug"}).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)) -> Response:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if db.query(Product).filter(Product.category_id == category_id).count():
        raise HTTPException(status_code=400, detail="Category has products; reassign them first")
    db.delete(cat)
    db.commit()
    return Response(status_code=204)


# ==================== Brands ====================
@router.get("/brands", response_model=list[BrandOut])
def list_brands(db: Session = Depends(get_db)) -> list[BrandOut]:
    return [BrandOut.model_validate(b) for b in db.query(Brand).order_by(Brand.sort_order).all()]


@router.post("/brands", response_model=BrandOut, status_code=201)
def create_brand(payload: BrandUpsert, db: Session = Depends(get_db)) -> BrandOut:
    slug = payload.slug or _slugify(payload.name)
    if db.query(Brand).filter(Brand.slug == slug).first():
        raise HTTPException(status_code=400, detail="Brand slug already exists")
    brand = Brand(**{**payload.model_dump(exclude={"slug"}), "slug": slug})
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.patch("/brands/{brand_id}", response_model=BrandOut)
def update_brand(brand_id: int, payload: BrandUpsert, db: Session = Depends(get_db)) -> BrandOut:
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    for field, value in payload.model_dump(exclude={"slug"}).items():
        setattr(brand, field, value)
    db.commit()
    db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.delete("/brands/{brand_id}", status_code=204)
def delete_brand(brand_id: int, db: Session = Depends(get_db)) -> Response:
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(brand)
    db.commit()
    return Response(status_code=204)
