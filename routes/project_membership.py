from flask import Blueprint, request, jsonify
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from database.project_membership import add_project_membership_db, delete_project_membership_db, update_project_membership_role_db
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles

bp = Blueprint("project_membership", __name__) 
@bp.route("/add-project-membership", methods=["POST"])
@token_required
@require_roles(["project_owner", "project_admin"])
def add_membership():
    data = request.get_json()

    required_fields = ["project_id", "role_id", "email", "added_by"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    project_id = data["project_id"]
    role_id = data["role_id"]
    email = data["email"]
    added_by = data["added_by"]
    result, status = add_project_membership_db(project_id, role_id, email, added_by)
    return jsonify(result), status

@bp.route("/delete-project-membership", methods=["POST"])
@token_required
@require_roles(["project_owner"])
def delete_project_membership():
    data = request.get_json()
    project_id = data.get("project_id")
    user_id = data.get("user_id")
    if not project_id or not user_id:
        return jsonify({"error": "project_id and user_id are required"}), 400

    result, status = delete_project_membership_db(project_id, user_id)
    return jsonify(result), status

@bp.route("/edit-project-membership", methods=["POST"])
@token_required
@require_roles(["project_owner"])
def update_member_role():
    try:
        data = request.get_json()

        if not data:
            return {"error": "Missing JSON body"}, 400
        
        project_id = data.get("project_id")
        user_id = data.get("user_id")
        role_id = data.get("role_id")

        if not project_id or not user_id or not role_id:
            return {"error": "project_id, user_id, and role_id are required"}, 400

        response, status = update_project_membership_role_db(
            project_id,
            user_id,
            role_id
        )
        return response, status

    except Exception as e:
        return {"error": "Server error", "details": str(e)}, 500
