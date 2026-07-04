from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.ai import (
    BudgetRequest,
    BudgetResponse,
    CalculateRequest,
    CalculateResponse,
    ColourRecommendRequest,
    ColourRecommendResponse,
    PlanStep,
    ProjectPlanRequest,
    ProjectPlanResponse,
    RecommendedColour,
    RecommendedProduct,
)
from app.services.ai_service import project_plan, recommend_colours
from app.services.calc_service import calculate_budget, calculate_paint

router = APIRouter(prefix="/ai", tags=["ai"])

# Grade → the sub-brand that carries that price tier.
GRADE_BRAND = {"style": "STYLE", "calista": "CALISTA", "one": "ONE"}


@router.post("/calculate", response_model=CalculateResponse)
def calculate(payload: CalculateRequest) -> CalculateResponse:
    result = calculate_paint(payload.area, payload.coats, payload.grade)
    return CalculateResponse(**result)


@router.post("/budget", response_model=BudgetResponse)
def budget(payload: BudgetRequest, db: Session = Depends(get_db)) -> BudgetResponse:
    result = calculate_budget(
        payload.area, payload.coats, payload.grade, payload.primer, payload.putty
    )
    # Recommend real catalogue products for this grade (interior emulsions first).
    brand = GRADE_BRAND.get(payload.grade)
    recs = (
        db.query(Product)
        .filter(Product.sub_brand == brand, Product.is_active.is_(True))
        .order_by(Product.tab != "interior", Product.price_low)
        .limit(3)
        .all()
    )
    result["recommended"] = [
        RecommendedProduct(
            id=p.id, slug=p.slug, name=p.name, sub_brand=p.sub_brand,
            image_url=p.image_url, price_low=p.price_low,
        )
        for p in recs
    ]
    return BudgetResponse(**result)


@router.post("/recommend-colours", response_model=ColourRecommendResponse)
def recommend(payload: ColourRecommendRequest) -> ColourRecommendResponse:
    recs, mock = recommend_colours(payload.room_type, payload.mood, payload.lighting)
    return ColourRecommendResponse(
        recommendations=[RecommendedColour(**r) for r in recs], mock=mock
    )


@router.post("/project-plan", response_model=ProjectPlanResponse)
def plan(payload: ProjectPlanRequest) -> ProjectPlanResponse:
    steps, summary, mock = project_plan(
        payload.property_type, payload.rooms, payload.budget, payload.timeline
    )
    return ProjectPlanResponse(
        steps=[PlanStep(**s) for s in steps], summary=summary, mock=mock
    )
