from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://localhost:5432/kamlesh_paints"
    JWT_SECRET: str = "dev-only-secret-change-me-minimum-32-characters"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    GEMINI_API_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @staticmethod
    def _is_real(value: str) -> bool:
        return bool(value) and not value.startswith("your_")

    @property
    def razorpay_enabled(self) -> bool:
        return self._is_real(self.RAZORPAY_KEY_ID) and self._is_real(self.RAZORPAY_KEY_SECRET)

    @property
    def gemini_enabled(self) -> bool:
        return self._is_real(self.GEMINI_API_KEY)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
