"""Shared slowapi limiter so both main.py and individual routes can use it."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Baseline: 300 requests/min per IP across the whole API; routes may set stricter
# per-endpoint limits (e.g. login) via @limiter.limit(...).
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
