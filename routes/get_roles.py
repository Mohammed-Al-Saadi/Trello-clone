from flask import Blueprint, jsonify
from database.get_roles import get_all_roles_db
from middleware.auth_middleware import token_required

get_roles_bp = Blueprint("get_roles_bp", __name__)
@get_roles_bp.route("/get-roles", methods=["GET"])
@token_required
def get_roles():
    result, status = get_all_roles_db()
    return jsonify(result), status
