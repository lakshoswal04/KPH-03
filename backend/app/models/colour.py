from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Colour(Base):
    __tablename__ = "colours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    hex: Mapped[str] = mapped_column(String(9))
    family: Mapped[str] = mapped_column(String(40), index=True)
    is_explorer_shade: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
