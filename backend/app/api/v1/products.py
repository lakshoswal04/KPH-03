from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductListOut, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

SORTS = {
    "featured": (Product.is_featured.desc(), Product.id.asc()),
    "name": (Product.name.asc(),),
    "price_asc": (Product.price_low.asc(),),
    "price_desc": (Product.price_high.desc(),),
    "newest": (Product.id.desc(),),
}


@router.get("", response_model=ProductListOut)
def list_products(
    tab: str | None = None,
    sub_brand: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    finish: str | None = None,
    interior_exterior: str | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    featured: bool | None = None,
    in_stock: bool | None = None,
    search: str | None = None,
    sort: str = "featured",
    include_inactive: bool = False,
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProductListOut:
    query = db.query(Product)
    if not include_inactive:
        query = query.filter(Product.is_active.is_(True))
    if tab:
        query = query.filter(Product.tab == tab)
    if sub_brand:
        query = query.filter(Product.sub_brand == sub_brand.upper())
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if brand_id:
        query = query.filter(Product.brand_id == brand_id)
    if finish:
        query = query.filter(Product.finish.ilike(f"%{finish}%"))
    if interior_exterior:
        query = query.filter(
            or_(
                Product.interior_exterior == interior_exterior,
                Product.interior_exterior == "both",
            )
        )
    if price_min is not None:
        query = query.filter(Product.price_high >= price_min)
    if price_max is not None:
        query = query.filter(Product.price_low <= price_max)
    if featured is not None:
        query = query.filter(Product.is_featured.is_(featured))
    if in_stock:
        query = query.filter(Product.stock > Product.reserved)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(like),
                Product.description.ilike(like),
                Product.sub_brand.ilike(like),
                Product.summary.ilike(like),
            )
        )

    total = query.count()
    query = query.order_by(*SORTS.get(sort, SORTS["featured"]))
    items = query.offset(offset).limit(limit).all()
    return ProductListOut(
        items=[ProductOut.model_validate(p) for p in items], total=total
    )


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductOut:
    product = db.query(Product).filter(Product.slug == slug).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(product)


@router.get("/{slug}/related", response_model=list[ProductOut])
def related_products(
    slug: str, limit: int = Query(default=4, ge=1, le=12), db: Session = Depends(get_db)
) -> list[ProductOut]:
    """Explicit related_product_ids first, then same-category fallback."""
    product = db.query(Product).filter(Product.slug == slug).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    picked: list[Product] = []
    seen: set[int] = {product.id}
    if product.related_product_ids:
        rows = (
            db.query(Product)
            .filter(Product.id.in_(product.related_product_ids), Product.is_active.is_(True))
            .all()
        )
        by_id = {p.id: p for p in rows}
        for pid in product.related_product_ids:
            if pid in by_id and pid not in seen:
                picked.append(by_id[pid])
                seen.add(pid)

    if len(picked) < limit and product.category_id:
        fillers = (
            db.query(Product)
            .filter(
                Product.category_id == product.category_id,
                Product.id.notin_(seen),
                Product.is_active.is_(True),
            )
            .order_by(Product.is_featured.desc(), Product.id)
            .limit(limit - len(picked))
            .all()
        )
        picked.extend(fillers)

    return [ProductOut.model_validate(p) for p in picked[:limit]]
