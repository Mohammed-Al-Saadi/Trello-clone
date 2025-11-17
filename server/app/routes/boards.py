from flask import Blueprint, request, jsonify
from database.boards import add_new_board , get_boards_for_project

add_boards_bp = Blueprint("add_boards_bp", __name__)

@add_boards_bp.post("/add-board")
def create_board():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON body required"}), 400

    project_id = data.get("project_id")
    name = data.get("name")
    position = data.get("position", 0)

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    if not name:
        return jsonify({"error": "Board name is required"}), 400

    result, status = add_new_board(project_id, name, position)
    return jsonify(result), status


get_boards_bp = Blueprint("get_boards_bp", __name__)

@get_boards_bp.route("/get-boards", methods=["POST"])
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