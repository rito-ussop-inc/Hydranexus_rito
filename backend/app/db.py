"""Supabase incident-history store (optional, offline-safe).

Reads SUPABASE_URL + SUPABASE_KEY (secret) or SUPABASE_ANON_KEY (publishable,
RLS-safe with the open-mvp policy). If env is missing or the request fails,
callers fall back to the hardcoded mock list — demo never breaks.
"""
from __future__ import annotations
import os

_client = None
_init_tried = False


def _key() -> str | None:
    return os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")


def client():
    global _client, _init_tried
    if _client is not None:
        return _client
    if _init_tried:
        return None
    _init_tried = True
    url = os.getenv("SUPABASE_URL")
    key = _key()
    if not url or not key:
        return None
    try:
        from supabase import create_client
        _client = create_client(url, key)
        return _client
    except Exception:
        return None


def is_configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and _key())


def row_to_incident(row: dict) -> dict:
    return {
        "id": row.get("id"),
        "title": row.get("title"),
        "type": row.get("type"),
        "location": row.get("location"),
        "zone": row.get("zone"),
        "started": row.get("started"),
        "status": row.get("status"),
        "severity": row.get("severity"),
        "confidence": row.get("confidence"),
        "lossPerHour": row.get("loss_per_hour"),
        "evidence": row.get("evidence") or [],
    }


def get_incidents(limit: int = 50) -> list[dict] | None:
    """Return DB rows newest-first, or None when DB is unavailable."""
    c = client()
    if c is None:
        return None
    try:
        res = c.table("incidents").select("*").order("created_at", desc=True).limit(limit).execute()
        return [row_to_incident(r) for r in (res.data or [])]
    except Exception:
        return None


def save_incident(item: dict) -> bool:
    """Upsert one incident FIR. Never raises — returns False on any failure."""
    c = client()
    if c is None:
        return False
    try:
        row = {
            "id": item.get("id"),
            "title": item.get("title"),
            "type": item.get("type"),
            "location": item.get("location"),
            "zone": item.get("zone"),
            "severity": item.get("severity"),
            "status": item.get("status", "Investigating"),
            "confidence": item.get("confidence"),
            "loss_per_hour": item.get("lossPerHour"),
            "started": item.get("started"),
            "evidence": item.get("evidence") or [],
        }
        c.table("incidents").upsert(row, on_conflict="id").execute()
        return True
    except Exception:
        return False
