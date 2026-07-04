from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.colour import Colour
from app.schemas.colour import ColourFamilyOut, ColourOut

router = APIRouter(prefix="/colours", tags=["colours"])


@router.get("", response_model=list[ColourOut])
def list_colours(
    family: str | None = None,
    explorer_only: bool = False,
    db: Session = Depends(get_db),
) -> list[ColourOut]:
    query = db.query(Colour)
    if family:
        query = query.filter(Colour.family == family)
    if explorer_only:
        query = query.filter(Colour.is_explorer_shade.is_(True))
    colours = query.order_by(Colour.sort_order, Colour.id).all()
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
