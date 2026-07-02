from fastapi import APIRouter

from app.schemas.ai import (
    CalculateRequest,
    CalculateResponse,
    ColourRecommendRequest,
    ColourRecommendResponse,
    ProjectPlanRequest,
    ProjectPlanResponse,
    RecommendedColour,
)
from app.services.ai_service import project_plan, recommend_colours
from app.services.calc_service import calculate_paint

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/calculate", response_model=CalculateResponse)
def calculate(payload: CalculateRequest) -> CalculateResponse:
    result = calculate_paint(payload.area, payload.coats, payload.grade)
    return CalculateResponse(**result)


@router.post("/recommend-colours", response_model=ColourRecommendResponse)
def recommend(payload: ColourRecommendRequest) -> ColourRecommendResponse:
    recs, mock = recommend_colours(payload.room_type, payload.mood, payload.lighting)
    return ColourRecommendResponse(
        recommendations=[RecommendedColour(**r) for r in recs], mock=mock
    )


@router.post("/project-plan", response_model=ProjectPlanResponse)
def plan(payload: ProjectPlanRequest) -> ProjectPlanResponse:
    text, mock = project_plan(
        payload.property_type, payload.rooms, payload.budget, payload.timeline
    )
    return ProjectPlanResponse(plan=text, mock=mock)
