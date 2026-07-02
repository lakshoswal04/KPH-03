from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductListOut, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListOut)
def list_products(
    tab: str | None = None,
    sub_brand: str | None = None,
    category_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> ProductListOut:
    query = db.query(Product)
    if tab:
        query = query.filter(Product.tab == tab)
    if sub_brand:
        query = query.filter(Product.sub_brand == sub_brand.upper())
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    items = query.order_by(Product.id).all()
    return ProductListOut(
        items=[ProductOut.model_validate(p) for p in items], total=len(items)
    )


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductOut:
    product = db.query(Product).filter(Product.slug == slug).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(product)
