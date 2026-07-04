# Kamlesh Paints & Hardware

Website + ordering platform for Kamlesh Paints & Hardware — authorised **Birla Opus** dealer,
Shivajinagar, Pune. Generates leads (calls, WhatsApp, free site-survey bookings) and takes
online orders with Razorpay. Delivery within Pune.

## Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Zustand · React Hook Form + Zod · Lucide |
| Backend   | FastAPI · SQLAlchemy · Alembic · Pydantic v2 · python-jose (JWT) · passlib/bcrypt |
| Database  | PostgreSQL |
| Payments  | Razorpay (server-side order creation + signature verification) |
| AI        | Gemini (colour recommender / project planner) with deterministic dev fallback |
| Images    | Cloudinary (placehold.co fallback in dev) |
| Hosting   | Vercel (frontend) · Railway (API + Postgres) — see `docs/DEPLOYMENT.md` |

## Repository layout

```
├── frontend/   Next.js 14 app (src/app, src/components, src/store, …)
├── backend/    FastAPI app (app/api/v1, app/models, app/services, migrations)
├── docs/       PRD + deployment guide
├── assets/     Logos & brand images
└── screenshot.mjs  Visual-QA helper (puppeteer)
```

## Local development

Prereqs: Node 18+, Python 3.12, PostgreSQL running locally with a `kamlesh_paints` database.

```bash
# Backend — http://localhost:8000 (OpenAPI docs at /docs)
cd backend
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then edit DATABASE_URL etc.
alembic upgrade head            # create schema
python seed.py                  # 8 categories · 16 products · 50 colours
python create_admin.py          # default: admin@kamleshpaints.in / kamlesh-admin-123
uvicorn main:app --reload --port 8000

# Frontend — http://localhost:3000
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

With no Razorpay/Gemini/Cloudinary keys configured the app runs in **dev fallback mode**:
checkout completes via a mock payment, the AI recommender returns curated picks, and product
imagery uses placehold.co.

## Before launch

Search the frontend for these placeholders and replace with real values:
`[YOUR PHONE NUMBER]` · `[YOUR WHATSAPP NUMBER]` · `[YOUR EMAIL ADDRESS]` ·
`[YOUR FULL ADDRESS]` · `[YOUR WEEKDAY HOURS]` · `[YOUR WEEKEND HOURS]`

Also: change the admin password, set a strong `JWT_SECRET`, and add real API keys
(see `docs/DEPLOYMENT.md`).
