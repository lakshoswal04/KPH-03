from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin, ai, auth, categories, colours, enquiries, orders, products, surveys
from app.core.config import settings

app = FastAPI(
    title="Kamlesh Paints & Hardware API",
    description="API for the Kamlesh Paints & Hardware website — authorised Birla Opus dealer, Shivajinagar, Pune.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
):
    app.include_router(router, prefix=API_V1)


@app.get("/", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kamlesh-paints-api"}
