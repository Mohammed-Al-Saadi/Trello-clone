# utils/jwt_helper.py
import jwt
from datetime import datetime, timedelta, timezone
import os

SECRET_KEY = os.getenv("JWT_SECRET", "secret")
ALGORITHM = "HS256"

def create_jwt_token(payload: dict, expires_in_seconds: int = 15 * 60) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=expires_in_seconds)
    claims = dict(payload)
    claims["iat"] = int(now.timestamp())
    claims["exp"] = int(exp.timestamp())
    token = jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)
    return token.decode() if isinstance(token, bytes) else token

def verify_jwt_token(token, is_refresh=False):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if is_refresh and decoded.get("type") != "refresh":
            return {"error": "Invalid refresh token type"}
        return decoded
    except jwt.ExpiredSignatureError:
        return {"error": "Token expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}

