from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Colour(Base):
    __tablename__ = "colours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Official Birla Opus shade code, e.g. "BB 5000". Null for legacy hero shades.
    code: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(80))
    hex: Mapped[str] = mapped_column(String(9))
    family: Mapped[str] = mapped_column(String(40), index=True)
    is_explorer_shade: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
