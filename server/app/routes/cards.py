from flask import Blueprint, request, jsonify
from database.cards import add_card_to_list, delete_card, update_card_details, update_card_positions_by_list, update_single_card_list
from middleware.auth_middleware import token_required
from middleware.role_middleware import require_roles

add_card_to_list_bp = Blueprint("add_card_to_list_bp", __name__)
@add_card_to_list_bp.route("/add-cards", methods=["POST"])
@token_required
def create_card():
    data = request.get_json()

    list_id = data.get("list_id")
    title = data.get("title")
    created_by = data.get("created_by") 
    priority = data.get("priority") or "low priority"
    if not list_id or not title or not created_by or not priority:
        return jsonify({"error": "list_id, title, and created_by are required"}), 400

    response, status_code = add_card_to_list(list_id, title, created_by, priority)
    return jsonify(response), status_code

delete_card_routes = Blueprint("delete_card_routes", __name__)
@delete_card_routes.route("/delete-cards", methods=["POST"])
@token_required
@require_roles(["project_owner","project_admin","project_member","board_admin"])
def delete_card_json_route():
    data = request.get_json(silent=True)
    if not data or "card_id" not in data:
        return jsonify({"error": "card_id is required"}), 400
    card_id = data["card_id"]
    response, status = delete_card(card_id)
    return jsonify(response), status

move_cards_in_same_list_bp = Blueprint('move_cards_in_same_list_bp', __name__)
@move_cards_in_same_list_bp.route('/update-cards-list', methods=['POST'])
@token_required
def reorder_cards():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    list_id = data.get("list_id")
    cards = data.get("cards")

    if list_id is None:
        return jsonify({"error": "Missing 'list_id'"}), 400
    if not isinstance(cards, list):
        return jsonify({"error": "'cards' must be a list"}), 400
    return update_card_positions_by_list(list_id, cards)

move_card_to_other_list_bp = Blueprint('move_card_to_other_list_bp', __name__)
@move_card_to_other_list_bp.route('/move-card-to-new-list', methods=['POST'])
@token_required
def move_card():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400
    card_id = data.get("card_id")
    new_list_id = data.get("new_list_id")
    new_position = data.get("new_position")
    if card_id is None or new_list_id is None or new_position is None:
        return jsonify({
            "error": "Missing required fields",
            "required": ["card_id", "new_list_id", "new_position"]
        }), 400
    try:
        card_id = int(card_id)
        new_list_id = int(new_list_id)
        new_position = int(new_position)
    except ValueError:
        return jsonify({"error": "Invalid integer fields"}), 400
    return update_single_card_list(card_id, new_list_id, new_position)


update_card_details_bp = Blueprint("update_card_details_bp", __name__)
@update_card_details_bp.route("/update-card-details", methods=["POST"])
@token_required
def update_card_route():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400
    card_id = data.get("card_id")
    title = data.get("title")
    priority = data.get("priority")
    if not card_id:
        return jsonify({"error": "card_id is required"}), 400
    if title is None and priority is None:
        return jsonify({
            "error": "Nothing to update",
        }), 400
    response, status = update_card_details(
        card_id=card_id,
        new_title=title,
        new_priority=priority
    )
    return jsonify(response), status
