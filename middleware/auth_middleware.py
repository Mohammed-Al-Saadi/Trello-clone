from functools import wraps
from flask import request, jsonify
from utils.jwt_helper import verify_jwt_token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")

        if not access_token and not refresh_token:
            return jsonify({"error": "No tokens provided"}), 401

        access_data = verify_jwt_token(access_token) if access_token else {"error": "No access token"}

        if "error" in access_data:
            refresh_data = verify_jwt_token(refresh_token, is_refresh=True) if refresh_token else {"error": "No refresh token"}
            if "error" in refresh_data:
                return jsonify({"error": "Invalid or expired token"}), 401
            request.decoded_token = refresh_data
        else:
            request.decoded_token = access_data

        return f(*args, **kwargs)

    return decorated

    