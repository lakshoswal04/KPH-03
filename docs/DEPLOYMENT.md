# Deployment Guide — Kamlesh Paints & Hardware

Frontend on **Vercel**, backend + PostgreSQL on **Railway**, images on **Cloudinary**,
payments on **Razorpay**. All four need accounts owned by you.

## 1. Railway — PostgreSQL + FastAPI

1. Create a Railway project → **Add service → PostgreSQL**. Copy its `DATABASE_URL`.
2. **Add service → GitHub repo**, pick this repo, set **Root Directory** to `backend/`.
3. Service settings:
   - Build: Nixpacks detects Python via `requirements.txt` automatically.
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Pre-deploy (or one-off shell): `alembic upgrade head && python seed.py`
4. Variables (Service → Variables):

   ```
   DATABASE_URL=<from the Postgres service — use the internal URL>
   JWT_SECRET=<random 32+ chars, e.g. `openssl rand -hex 32`>
   JWT_ALGORITHM=HS256
   RAZORPAY_KEY_ID=rzp_live_…       (or rzp_test_… while testing)
   RAZORPAY_KEY_SECRET=…
   CLOUDINARY_CLOUD_NAME=…
   CLOUDINARY_API_KEY=…
   CLOUDINARY_API_SECRET=…
   GEMINI_API_KEY=…
   CORS_ORIGINS=https://<your-vercel-domain>
   ```

5. Create the admin once: Railway shell → `python create_admin.py you@example.com <strong-password>`
6. Note the public URL Railway assigns, e.g. `https://kamlesh-api.up.railway.app`.
   Check `https://…/docs` renders the OpenAPI docs.

## 2. Vercel — Next.js frontend

1. Import the GitHub repo in Vercel, set **Root Directory** to `frontend/`.
2. Environment variables:

   ```
   NEXT_PUBLIC_API_URL=https://<railway-api-domain>
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_…
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=…
   ```

3. Deploy. Every push to `main` auto-deploys. Product pages are SSG + ISR
   (revalidate 300s), so the Railway API must be reachable during builds.

## 3. Razorpay

1. Dashboard → API Keys → generate live keys. Put the key id in both Vercel
   (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) and Railway (`RAZORPAY_KEY_ID`); the secret only in Railway.
2. Dashboard → Webhooks → add `https://<railway-api-domain>/api/v1/orders/webhook`,
   subscribe to `payment.captured`, and use `RAZORPAY_KEY_SECRET` as the webhook secret
   (the backend verifies the `X-Razorpay-Signature` HMAC).
3. Payment flow: order created server-side → Razorpay checkout on the client →
   signature verified server-side (`/orders/verify`) → webhook as backstop.
   The frontend is never trusted for payment status.

## 4. Cloudinary

1. Free tier account → copy cloud name, API key, API secret into Railway variables and
   the cloud name into Vercel.
2. Upload product/shade images; store their URLs in `products.image_url`
   (until then the site uses placehold.co placeholders).
3. Use URL transformations (`f_auto,q_auto,w_…`) for WebP + responsive sizing.

## 5. Post-deploy checklist

- [ ] `https://<api>/docs` loads and lists all `/api/v1` endpoints
- [ ] Home page renders with products/colours (API reachable from Vercel)
- [ ] Test order with a Razorpay **test key** end-to-end before going live
- [ ] Admin login works at `/admin` with the new credentials
- [ ] All `[YOUR …]` placeholders replaced (grep the frontend)
- [ ] `CORS_ORIGINS` matches the final domain exactly (https, no trailing slash)
