from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter

from app.api.v1 import (
    admin,
    ai,
    auth,
    categories,
    colours,
    customers,
    dashboard,
    enquiries,
    inventory,
    orders,
    products,
    surveys,
    whatsapp,
)
from app.core.config import settings
from app.services.image_service import UPLOAD_DIR

app = FastAPI(
    title="Kamlesh Paints & Hardware API",
    description="API for the Kamlesh Paints & Hardware website — authorised Birla Opus dealer, Shivajinagar, Pune.",
    version="1.0.0",
)

# Per-IP rate limiting (baseline abuse protection across the whole API).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve locally-uploaded product images (used when Cloudinary isn't configured).
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

API_V1 = "/api/v1"
for router in (
    products.router,
    categories.router,
    colours.router,
    enquiries.router,
    surveys.router,
    orders.router,
    auth.router,
    admin.router,
    ai.router,
    inventory.router,
    dashboard.router,
    customers.router,
    whatsapp.router,
):
    app.include_router(router, prefix=API_V1)


@app.get("/", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kamlesh-paints-api"}
