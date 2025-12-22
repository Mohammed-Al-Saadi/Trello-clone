# routes/board_list.py
from flask import Blueprint, request, jsonify
from database.board_list import (
    add_board_list,
    delete_list,
    get_lists_by_board_id,
    update_list_name as update_list_name_db,
    update_list_positions,
)
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles
bp = Blueprint("board_list", __name__)  

@bp.route("/add-board-list", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin","project_member","board_admin","board_member"])
def create_list():
    data = request.get_json()
    if not data or "name" not in data or "board_id" not in data:
        return jsonify({"error": "Missing 'name' or 'board_id'"}), 400

    result, status = add_board_list(data["board_id"], data["name"], position=None)
    return jsonify(result), status


@bp.route("/delete-board-list", methods=["DELETE"])
@token_required
@require_roles(["project_owner","project_admin","board_admin"])
def remove_list():
    data = request.get_json()
    if not data or "list_id" not in data:
        return jsonify({"error": "Missing 'list_id'"}), 400

    result, status = delete_list(data["list_id"])
    return jsonify(result), status


@bp.route("/get-board-lists", methods=["POST"])
@token_required
def get_board_lists():
    data = request.get_json()
    if not data or "board_id" not in data:
        return jsonify({"error": "board_id is required"}), 400

    result, status = get_lists_by_board_id(data["board_id"])
    return jsonify(result), status


@bp.route("/update-board-list-positions", methods=["POST"])
@token_required
def update_board_list_positions():
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Invalid format. Expected a list of objects"}), 400

    result, status = update_list_positions(data)
    return jsonify(result), status


@bp.route("/update-list-name", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin","board_admin"])
def update_list_name_route():
    data = request.get_json()
    if not data or "id" not in data or "name" not in data:
        return jsonify({"error": "Missing id or name"}), 400

    result, status = update_list_name_db(data["id"], data["name"])
    return jsonify(result), status
