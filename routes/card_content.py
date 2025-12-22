from flask import Blueprint, request, jsonify
from database.card_content import add_card_content, add_comment, delete_comment, get_card_content, get_comments
from middleware.auth_middleware import token_required

bp = Blueprint("card_content", __name__)


@bp.route("/add-cards-content", methods=["POST", "PUT"])
@token_required
def save_card_content():
    try:
        data = request.get_json() or {}

        card_id = data.get("card_id")
        content_html = data.get("content_html")
        due_date = data.get("due_date")
        status = data.get("status")  

        if not card_id:
            return jsonify({"error": "card_id is required"}), 400

        if (
            "content_html" not in data
            and "due_date" not in data
            and "status" not in data
        ):
            return jsonify({
                "error": "At least one field must be included",
                "allowed": ["content_html", "due_date", "status"]
            }), 400

        result, status_code = add_card_content(
            card_id=card_id,
            content_html=content_html,
            due_date=due_date,
            status=status  
        )

        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/get-card-content", methods=["POST"])
@token_required
def get_card_content_route():
    try:
        data = request.get_json() or {}
        card_id = data.get("card_id")

        if card_id is None:
            return jsonify({"error": "card_id is required"}), 400

        result, status_code = get_card_content(card_id)
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@bp.route("/add-card-comment", methods=["POST"])
@token_required
def add_comment_route():
    data = request.get_json() or {}

    card_id = data.get("card_id")
    user_id = data.get("user_id")
    comment = data.get("comment")

    if not card_id or not user_id or not comment:
        return jsonify({
            "error": "comment is required"
        }), 400

    response, status = add_comment(card_id, user_id, comment)
    return jsonify(response), status


@bp.route("/delete-comment", methods=["POST"])
@token_required
def delete_comment_route():
    data = request.get_json() or {}
    comment_id = data.get("comment_id")

    if not comment_id:
        return jsonify({"error": "comment_id is required"}), 400

    response, status = delete_comment(comment_id)
    return jsonify(response), status



@bp.route("/get-comment", methods=["POST"])
@token_required
def get_comments_route():
    data = request.get_json() or {}
    card_id = data.get("card_id")

    if not card_id:
        return jsonify({"error": "card_id is required"}), 400

    response, status = get_comments(card_id)
    return jsonify(response), status
