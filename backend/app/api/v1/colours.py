from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.colour import Colour
from app.schemas.colour import ColourFamilyOut, ColourOut

router = APIRouter(prefix="/colours", tags=["colours"])


@router.get("", response_model=list[ColourOut])
def list_colours(
    family: str | None = None,
    explorer_only: bool = False,
    search: str | None = None,
    limit: int = Query(1000, ge=1, le=3000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[ColourOut]:
    """Colour listing with server-side family/search filtering and paging, so the
    storefront can page through the 2,322-shade catalogue instead of loading it
    all at once. A page shorter than `limit` signals the end of the results."""
    query = db.query(Colour)
    if family and family != "All":
        query = query.filter(Colour.family == family)
    if explorer_only:
        query = query.filter(Colour.is_explorer_shade.is_(True))
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(or_(Colour.name.ilike(like), Colour.code.ilike(like)))

    colours = (
        query.order_by(Colour.sort_order, Colour.id).offset(offset).limit(limit).all()
    )
    return [ColourOut.model_validate(c) for c in colours]


@router.get("/families", response_model=list[ColourFamilyOut])
def list_families(db: Session = Depends(get_db)) -> list[ColourFamilyOut]:
    rows = (
        db.query(Colour.family, func.min(Colour.hex), func.count(Colour.id))
        .group_by(Colour.family)
        .order_by(func.min(Colour.sort_order))
        .all()
    )
    return [ColourFamilyOut(family=family, hex=hex_, count=count) for family, hex_, count in rows]
