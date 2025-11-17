from flask import Blueprint, request, jsonify
from database.projects import add_new_project, get_all_project_for_user,delete_project ,update_project

from middleware.auth_middleware import token_required


add_projects_bp = Blueprint('add_projects_bp', __name__)

@add_projects_bp.route('/add-project', methods=['POST'])
@token_required
def create_project():
    try:
        # ✅ Ensure JSON body
        if not request.is_json:
            return jsonify({"error": "Request must be in JSON format"}), 400

        data = request.get_json()

        # ✅ Extract fields
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


get_projects_bp = Blueprint('get_projects_bp', __name__)

@get_projects_bp.route('/get-projects', methods=['POST'])
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

update_projects_bp = Blueprint('update_projects_bp', __name__)

@update_projects_bp.route('/update-project', methods=['PUT'])
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


delete_projects_bp = Blueprint('delete_projects_bp', __name__)
@delete_projects_bp.route('/delete-project', methods=['POST'])
@token_required

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
