"""Společné ověření časovače (kojení / spánek) posílaného frontendem."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException


def parse_timer(timer_mode: Optional[str], timer_start: Optional[str], allowed: tuple) -> Optional[dict]:
    """Vrátí {"mode", "start"} se startem v UTC (ISO 8601 se „Z“), nebo None, když frontend nic neposlal."""
    if timer_mode is None and timer_start is None:
        return None
    if timer_mode not in allowed or not timer_start:
        raise HTTPException(status_code=422, detail="Neplatný stav časovače")
    try:
        dt = datetime.fromisoformat(timer_start.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Neplatný čas začátku časovače")
    if dt.tzinfo is None:
        raise HTTPException(status_code=422, detail="Čas začátku časovače musí obsahovat časové pásmo")
    start_utc = dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return {"mode": timer_mode, "start": start_utc}
