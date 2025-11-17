from flask import Blueprint, request, jsonify
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from database.project_membership import add_membership_db
add_membership_bp = Blueprint("add_membership_bp", __name__)

@add_membership_bp.route("/add-membership", methods=["POST"])
def add_membership():
    data = request.get_json()

    required_fields = ["project_id", "board_id","role_id", "email", "added_by"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    project_id = data["project_id"]
    board_id = data["board_id"]
    role_id = data["role_id"]
    email = data["email"]
    added_by = data["added_by"]


    result, status = add_membership_db(project_id, board_id, role_id, email,added_by )
    return jsonify(result), status
