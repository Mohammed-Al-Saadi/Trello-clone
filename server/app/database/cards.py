from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_card_to_list(list_id: int, title: str, created_by: int, priority: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT COALESCE(MAX(position), -1) + 1 AS next_position
            FROM cards
            WHERE list_id = %s
        """, (list_id,))
        result = cur.fetchone()
        position = result["next_position"]
        cur.execute("""
            INSERT INTO cards (list_id, title, position, created_by, priority )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, title, position, created_by, created_at, priority
        """, (list_id, title, position, created_by, priority))

        new_card = cur.fetchone()
        conn.commit()

        return {
            "message": "New card added successfully",
            "card": new_card
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()

def delete_card(card_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("DELETE FROM cards WHERE id = %s", (card_id,))
        conn.commit()

        return {"message": "Card deleted successfully"}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()

def update_card_positions_by_list(list_id: int, cards: list):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        conn.autocommit = False
        for index, card in enumerate(cards):
            cur.execute("""
                UPDATE cards
                SET position = %s
                WHERE id = %s AND list_id = %s
            """, (
                index,        
                card["id"],   
                list_id        
            ))

        conn.commit()

        return {
            "message": "List updated successfully"
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {
            "error": f"Database error: {e.pgerror or str(e)}"
        }, 400

    finally:
        cur.close()
        conn.close()

def update_single_card_list(card_id: int, new_list_id: int, new_position: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            UPDATE cards
            SET position = position + 1
            WHERE list_id = %s AND position >= %s
        """, (new_list_id, new_position))

        cur.execute("""
            UPDATE cards
            SET list_id = %s,
                position = %s
            WHERE id = %s
            RETURNING id, list_id, position
        """, (new_list_id, new_position, card_id))

        updated_card = cur.fetchone()

        conn.commit()

        return {
            "message": "Card moved & positions updated successfully",
            "card": updated_card
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()


def update_card_details(card_id: int, new_title: str = None, new_priority: str = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    update_fields = []
    update_values = []
    updated = [] 

    if new_title is not None:
        update_fields.append("title = %s")
        update_values.append(new_title)
        updated.append("title")

    if new_priority is not None:
        update_fields.append("priority = %s")
        update_values.append(new_priority)
        updated.append("priority")

    if not update_fields:
        return {"error": "No fields provided to update."}, 400

    update_values.append(card_id)

    query = f"""
        UPDATE cards
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING id, title, priority, list_id, position, created_by, created_at;
    """

    try:
        cur.execute(query, update_values)
        updated_card = cur.fetchone()

        if not updated_card:
            return {"error": "Card not found"}, 404

        conn.commit()
        if updated == ["title"]:
            msg = "Title updated successfully"
        elif updated == ["priority"]:
            msg = "Priority updated successfully"
        else:
            msg = "Title and priority updated successfully"

        return {
            "message": msg,
            "card": updated_card
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
