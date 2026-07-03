import uuid
from pathlib import Path

from app.core.config import settings

# Local upload dir (served as static files at /uploads by main.py). Used when
# Cloudinary is not configured, so product-image upload works with no keys.
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"

ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}


def save_product_image(filename: str, data: bytes) -> str:
    """Persist an uploaded product image and return its public URL.

    Uploads to Cloudinary when configured; otherwise writes to the local
    uploads/ dir and returns a {PUBLIC_BASE_URL}/uploads/<name> URL.
    """
    ext = Path(filename).suffix.lower() or ".png"
    if ext not in ALLOWED_EXT:
        ext = ".png"

    if settings.cloudinary_enabled:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        result = cloudinary.uploader.upload(data, folder="kamlesh-products")
        return result["secure_url"]

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{name}"
