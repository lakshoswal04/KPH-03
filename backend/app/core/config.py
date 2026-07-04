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

    # SMTP email (optional — notifications log to stdout until these are set).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    NOTIFY_EMAIL: str = ""

    # Public base URL of this API — used to build absolute URLs for locally
    # uploaded product images served from /uploads.
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Commerce settings (rupees / percent). Paints & coatings are 18% GST in India.
    GST_RATE: int = 18
    DELIVERY_CHARGE: int = 30
    FREE_DELIVERY_THRESHOLD: int = 2000
    GSTIN: str = ""  # dealer GST number, printed on invoices when set

    # WhatsApp Business Cloud API (optional — logs in dev until configured).
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "kamlesh-verify"
    WHATSAPP_APP_SECRET: str = ""

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
    def email_enabled(self) -> bool:
        return self._is_real(self.SMTP_HOST) and self._is_real(self.SMTP_USER)

    @property
    def cloudinary_enabled(self) -> bool:
        return (
            self._is_real(self.CLOUDINARY_CLOUD_NAME)
            and self._is_real(self.CLOUDINARY_API_KEY)
            and self._is_real(self.CLOUDINARY_API_SECRET)
        )

    @property
    def whatsapp_enabled(self) -> bool:
        return self._is_real(self.WHATSAPP_TOKEN) and self._is_real(self.WHATSAPP_PHONE_ID)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
