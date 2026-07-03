from pydantic import BaseModel, Field


class CalculateRequest(BaseModel):
    area: float = Field(gt=0, le=100000, description="Floor area in sq ft")
    coats: int = Field(ge=1, le=3)
    grade: str = Field(pattern="^(style|calista|one)$")


class CalculateResponse(BaseModel):
    litres: int
    cost_low: int
    cost_high: int
    labour_low: int
    labour_high: int


class ColourRecommendRequest(BaseModel):
    room_type: str = Field(min_length=2, max_length=60)
    mood: str = Field(min_length=2, max_length=120)
    lighting: str = Field(min_length=2, max_length=60)


class RecommendedColour(BaseModel):
    name: str
    hex: str
    reason: str


class ColourRecommendResponse(BaseModel):
    recommendations: list[RecommendedColour]
    mock: bool


class ProjectPlanRequest(BaseModel):
    property_type: str = Field(min_length=2, max_length=60)
    rooms: str = Field(min_length=2, max_length=200)
    budget: str = Field(min_length=1, max_length=60)
    timeline: str = Field(min_length=2, max_length=60)


class PlanStep(BaseModel):
    title: str
    detail: str


class ProjectPlanResponse(BaseModel):
    steps: list[PlanStep]
    summary: str
    mock: bool
