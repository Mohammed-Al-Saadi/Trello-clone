from flask import Blueprint, request, jsonify
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from database.board_membership import add_board_membership_db, delete_board_member_db, update_board_member_role_db
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles

bp = Blueprint("board_membership", __name__)  


@bp.route("/add-board-membership", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin"])
def add_membership():
    data = request.get_json()

    required_fields = ["board_id", "role_id", "email", "added_by"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    board_id = data["board_id"]
    role_id = data["role_id"]
    email = data["email"]
    added_by = data["added_by"]
    result, status = add_board_membership_db(board_id, role_id, email, added_by)
    return jsonify(result), status

@bp.route("/update-board-membership", methods=["PUT"])
@token_required
def update_board_member_role():
    data = request.get_json()
    required_fields = ["board_id", "user_id", "role_id"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    board_id = data["board_id"]
    user_id = data["user_id"]
    role_id = data["role_id"]
    result, status = update_board_member_role_db(board_id, user_id, role_id)
    return jsonify(result), status

@bp.route("/delete-board-membership", methods=["POST"])
@token_required
def delete_board_membership():
    data = request.get_json()

    board_id = data.get("board_id")
    user_id = data.get("user_id")

    if not board_id or not user_id:
        return jsonify({"error": "Missing board_id or user_id"}), 400

    result, status = delete_board_member_db(board_id, user_id)
    return jsonify(result), status