from functools import wraps
from flask import request, jsonify

def require_roles(allowed_roles):
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            role_name = request.headers.get("X-Role-Name")
            if not role_name:  
                json_data = request.get_json(silent=True) or {}
                role_name = json_data.get("role_name")
            if role_name not in allowed_roles:
                return jsonify({
                    "error": "Permission denied. You do not have permission to perform this action.",
                }), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator
