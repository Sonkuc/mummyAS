"""Ověření přihlášeného uživatele přes Supabase access token.

Frontend posílá hlavičku `Authorization: Bearer <access_token>` (token ze
supabase.auth.getSession()). Backend token ověří dotazem na Supabase Auth
(GET /auth/v1/user) a vrátí id uživatele. Výsledek se krátce cachuje, aby se
Supabase nevolal při každém požadavku. Hlavičce X-User-Id se nevěří.
"""

import json
import os
import threading
import time
import urllib.error
import urllib.request
from typing import Optional

from fastapi import Header, HTTPException

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://nayivuagrbjklmtinfjv.supabase.co"
).rstrip("/")
# Veřejný (anon / publishable) klíč projektu – stejný jako v lib/supabase.ts.
SUPABASE_ANON_KEY = os.environ.get(
    "SUPABASE_ANON_KEY",
    "sb_publishable_S5YU_t06KFcDHaBfwAGgRQ_m8zNvSys",
)

CACHE_TTL_SECONDS = 60
_cache: dict[str, tuple[str, float]] = {}
_cache_lock = threading.Lock()


def _unauthorized(detail: str = "Nepřihlášený uživatel") -> HTTPException:
    return HTTPException(
        status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"}
    )


def _fetch_user_id(token: str) -> str:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_ANON_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise _unauthorized("Neplatný nebo prošlý token")
        raise HTTPException(status_code=503, detail="Ověření přihlášení selhalo")
    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(status_code=503, detail="Ověření přihlášení selhalo")

    user_id = data.get("id")
    if not user_id:
        raise _unauthorized("Neplatný token")
    return str(user_id)


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """FastAPI závislost: vrátí id přihlášeného uživatele, jinak 401."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorized()
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise _unauthorized()

    now = time.time()
    with _cache_lock:
        cached = _cache.get(token)
        if cached and cached[1] > now:
            return cached[0]

    user_id = _fetch_user_id(token)

    with _cache_lock:
        # jednoduchý úklid, ať cache neroste donekonečna
        if len(_cache) > 1000:
            for k in [k for k, (_, exp) in _cache.items() if exp <= now]:
                _cache.pop(k, None)
        _cache[token] = (user_id, now + CACHE_TTL_SECONDS)
    return user_id
