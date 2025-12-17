from flask import Blueprint, request
from database.card_membership import add_card_membership_db, delete_card_membership_db
from middleware.auth_middleware import token_required

add_card_membership_bp = Blueprint("add_card_membership_bp", __name__)
@add_card_membership_bp.post("/cards-assign-member")
@token_required
def assign_members():
    data = request.get_json()
    card_id = data.get("card_id")
    user_ids = data.get("user_ids")  

    if not card_id or not user_ids:
        return {"error": "card_id and user_ids are required"}, 400

    results = []

    for user_id in user_ids:
        response, status = add_card_membership_db(card_id, user_id)

        results.append({
            "user_id": user_id,
            "status": status,
            "response": response
        })

    return {
        "message": "Assignment process completed",
        "results": results
    }, 207 

delete_card_membership_bp = Blueprint("delete_card_membership_bp", __name__)
@delete_card_membership_bp.delete("/cards-remove-member")
@token_required
def remove_member():
    data = request.get_json()

    card_id = data.get("card_id")
    user_id = data.get("user_id")

    if not card_id or not user_id:
        return {"error": "card_id and user_id are required"}, 400

    response, status = delete_card_membership_db(card_id, user_id)

    results = [{
        "user_id": user_id,
        "status": status,
        "response": response
    }]

    return {
        "message": "Removal process completed",
        "results": results
    }, status
