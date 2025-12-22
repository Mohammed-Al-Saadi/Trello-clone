from functools import wraps
from flask import request, jsonify
import jwt
from database.get_user_role_name import get_user_role_name_db
from utils.jwt_helper import SECRET_KEY


def require_roles(allowed_roles):
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            access_token = request.cookies.get("access_token")
            refresh_token = request.cookies.get("refresh_token")

            user_id = None

            # 1️⃣ Try access token first (if exists)
            if access_token:
                try:
                    decoded = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
                    user_id = decoded.get("id")
                except jwt.ExpiredSignatureError:
                    # expired, will try refresh token next
                    pass
                except jwt.InvalidTokenError:
                    return jsonify({"error": "Invalid access token"}), 401

            # 2️⃣ If no access token or it’s expired, try refresh token
            if not user_id and refresh_token:
                try:
                    refresh_decoded = jwt.decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
                    user_id = refresh_decoded.get("id")
                except jwt.ExpiredSignatureError:
                    return jsonify({"error": "Refresh token has expired"}), 401
                except jwt.InvalidTokenError:
                    return jsonify({"error": "Invalid refresh token"}), 401

            # 3️⃣ Still no valid token?
            if not user_id:
                return jsonify({"error": "Missing or invalid authentication tokens"}), 401

            # 4️⃣ Extract project_id
            json_data = request.get_json(silent=True) or {}
            project_id = (
                json_data.get("project_id")
                or request.args.get("project_id", type=int)
            )

            if not project_id:
                return jsonify({"error": "Missing project_id"}), 400

            # 5️⃣ Get role for this project
            role_name = get_user_role_name_db(user_id, project_id)

            # 6️⃣ Check if user’s role is allowed
            if role_name not in allowed_roles:
                return jsonify({
                    "error": "Permission denied. You do not have permission to perform this action.",
                    "user_role": role_name
                }), 403

            # ✅ All good — proceed
            return func(*args, **kwargs)

        return wrapper
    return decorator
