from slowapi import Limiter
from fastapi import Request


def get_real_ip(request: Request) -> str:
    """Extract real client IP from X-Forwarded-For (Cloud Run sets this)."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP (original client), not the LB IP
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip)
