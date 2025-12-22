from flask import Blueprint, request, jsonify
from database.projects import add_new_project, get_all_project_for_user,delete_project ,update_project
from middleware.auth_middleware import token_required
from time import sleep
from middleware.role_middleware import require_roles

bp = Blueprint("projects", __name__) 
@bp.route('/add-project', methods=['POST'])
@token_required
def create_project():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be in JSON format"}), 400
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')
        owner_id = data.get('owner_id')
        category = data.get('category')

        if not name or owner_id is None:
            return jsonify({"error": "Missing required fields: 'name' and 'owner_id'"}), 400

        response, status_code = add_new_project(name, description, owner_id, category)
        return jsonify(response), status_code

    except Exception as e:
        return jsonify({
            "error": "An unexpected error occurred while creating the project.",
            "details": str(e)
        }), 500


@bp.route('/get-projects', methods=['POST'])
@token_required
def get_projects():
    """Return all projects for the given user_id (sent from frontend)."""
    data = request.get_json()
    user_id = data.get("owner_id")

    if not user_id:
        return jsonify({"error": "Missing owner_id"}), 400

    projects, status = get_all_project_for_user(user_id)

    if isinstance(projects, dict) and "error" in projects:
        return jsonify(projects), 400

    return jsonify(projects), status

@bp.route('/update-project', methods=['PUT'])
@require_roles(["project_owner"])
@token_required
def edit_project():
    try:
        data = request.get_json()
        project_id = data.get("project_id")
        owner_id = data.get("owner_id")
        name = data.get("name")
        description = data.get("description")
        category = data.get("category")

        if not project_id or not owner_id:
            return jsonify({"error": "Missing project_id or owner_id"}), 400
        updated, status = update_project(
            project_id,
            owner_id,
            name,
            description,
            category,
        )
        return jsonify(updated), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/delete-project', methods=['POST'])
@token_required
@require_roles(["project_owner"])
def remove_project():
    try:
        data = request.get_json()
        project_id = data.get("project_id")
        owner_id = data.get("owner_id")
        print(project_id, owner_id)
        if not project_id or not owner_id:
            return jsonify({"error": "Missing project_id or owner_id"}), 400
        deleted, status = delete_project(project_id, owner_id)
        return jsonify(deleted), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500
