#!/usr/bin/env bash
# Bring the Kamlesh Paints backend up from a clean database:
#   1. apply migrations   2. seed the catalogue   3. create the admin user
#
# Usage:  cd backend && bash bootstrap.sh
# Requires: a running Postgres reachable at DATABASE_URL (see .env / .env.example).
# The app works with no API keys — payments, AI, email, and image hosting all
# fall back to mock/local behaviour until you add real keys to .env.
set -euo pipefail

cd "$(dirname "$0")"

# Prefer the project virtualenv if present, else the system python.
PY="./venv/bin/python"
[ -x "$PY" ] || PY="python3"
ALEMBIC="./venv/bin/alembic"
[ -x "$ALEMBIC" ] || ALEMBIC="alembic"

if [ ! -f .env ]; then
  echo "→ No .env found; copying .env.example (dev defaults, no keys needed)."
  cp .env.example .env
fi

echo "→ Applying database migrations…"
"$ALEMBIC" upgrade head

echo "→ Seeding catalogue (idempotent)…"
"$PY" seed.py

echo "→ Ensuring admin user…"
"$PY" create_admin.py

echo "✓ Backend ready. Start it with:  uvicorn main:app --port 8000"
