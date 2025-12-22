from flask import Blueprint, request, jsonify
from database.boards import add_new_board , get_boards_for_project,delete_board,update_board
from database.board_list import add_board_list
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles

bp = Blueprint("boards", __name__) 

@bp.post("/add-board")
@token_required
@require_roles(["project_owner","project_admin"])
def create_board():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON body required"}), 400
    project_id = data.get("project_id")
    name = data.get("name")
    position = data.get("position", 0)
    category  = data.get("category")

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400
    if not name:
        return jsonify({"error": "Board name is required"}), 400
    if not category:
        return jsonify({"error": "category name is required"}), 400
    result, status = add_new_board(project_id, name, position, category)
    if status != 201:
        return jsonify(result), status
    board_id = result["board"]["id"]   
    default_lists = [
        {"name": "To Do", "position": 0},
        {"name": "In Progress", "position": 1},
        {"name": "Done", "position": 2}
    ]

    for lst in default_lists:
        add_board_list(board_id, lst["name"], lst["position"])

    return jsonify({
        "message": "Board created successfully",
        "board": result["board"]
    }), 201

@bp.route("/get-boards", methods=["POST"])
@token_required
def get_boards():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON body required"}), 400

    project_id = data.get("project_id")
    user_id = data.get("user_id")
    if not project_id and not user_id:
        return jsonify({"error": "project_id is required"}), 400
    result, status = get_boards_for_project(project_id, user_id)
    return jsonify(result), status

@bp.route('/delete-board', methods=['POST'])
@token_required
@require_roles(["project_owner"])
def delete_board_post_json():
    data = request.get_json()

    if not data or 'project_id' not in data or 'board_id' not in data:
        return {"error": "project_id and board_id required"}, 400

    project_id = data['project_id']
    board_id = data['board_id']
    result, status = delete_board(project_id, board_id)
    return result, status

@bp.route('/edit-board', methods=['PUT'])
@token_required
@require_roles(["project_owner","project_admin"])
def edit_board_route():
    data = request.get_json()

    board_id = data.get('board_id')
    name = data.get('name')
    category = data.get('category')

    if not board_id or not name or not category:
        return jsonify({"error": "Missing required fields"}), 400

    return update_board(board_id, name, category)