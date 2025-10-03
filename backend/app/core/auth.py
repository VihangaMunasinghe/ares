from fastapi import Header, HTTPException
from .config import get_settings

settings = get_settings()

async def get_user_id(authorization: str | None = Header(default=None)) -> str | None:
    """
    Return sub (user id) from Supabase JWT if provided.
    For local dev: returns None when AUTH_DISABLED is true.
    In production, parse/verify JWT (optionally via JWKS).
    """
    if settings.AUTH_DISABLED:
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    # NOTE: For brevity we don't verify JWT here.
    # In prod, decode/verify token, then extract 'sub'
    # Or call Supabase /auth/v1/user with the token.
    # Here we just return None to let RLS (service role) handle server writes if needed.
    return None
