from pydantic import BaseModel, ConfigDict


class ColourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    hex: str
    family: str
    is_explorer_shade: bool
    sort_order: int


class ColourFamilyOut(BaseModel):
    family: str
    hex: str
    count: int
