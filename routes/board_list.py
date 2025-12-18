from flask import Blueprint, request, jsonify
from database.board_list import add_board_list, delete_list, get_lists_by_board_id, update_list_name, update_list_positions
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles

add_lists_bp = Blueprint("add_lists_bp", __name__)
@add_lists_bp.route("/add-board-list", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin","project_member","board_admin","board_member"])
def create_list():
    data = request.get_json()
    if not data or "name" not in data or "board_id" not in data:
        return jsonify({"error": "Missing 'name' or 'board_id'"}), 400

    board_id = data["board_id"]
    name = data["name"]
    result, status = add_board_list(board_id, name, position=None)
    return jsonify(result), status

delete_board_lists_bp = Blueprint("delete_board_lists_bp", __name__)
@delete_board_lists_bp.route("/delete-board-list", methods=["DELETE"])
@token_required
@require_roles(["project_owner","project_admin","board_admin"])
def remove_list():
    data = request.get_json()

    if not data or "list_id" not in data:
        return jsonify({"error": "Missing 'list_id'"}), 400

    list_id = data["list_id"]

    result, status = delete_list(list_id)
    return jsonify(result), status


get_board_lists_bp = Blueprint("get_board_lists_bp", __name__)
@get_board_lists_bp.post("/get-board-lists")
@token_required
def get_board_lists():
    data = request.get_json()

    if not data or "board_id" not in data:
        return jsonify({"error": "board_id is required"}), 400

    board_id = data["board_id"]
    result, status = get_lists_by_board_id(board_id)
    return jsonify(result), status


update_board_lists_position_bp = Blueprint("update_board_lists_position_bp", __name__)
@update_board_lists_position_bp.route("/update-board-list-positions", methods=["POST"])
@token_required
def update_board_list_positions():

    data = request.get_json()

    if not isinstance(data, list):
        return jsonify({"error": "Invalid format. Expected a list of objects"}), 400

    result, status = update_list_positions(data)
    return jsonify(result), status




update_list_name_bp = Blueprint("update_list_name_bp", __name__)
@update_list_name_bp.route("/update-list-name", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin","board_admin"])
def update_list_name_route():
    data = request.get_json()

    if not data or "id" not in data or "name" not in data:
        return jsonify({"error": "Missing id or name"}), 400

    list_id = data["id"]
    new_name = data["name"]

    result, status = update_list_name(list_id, new_name)
    return jsonify(result), status