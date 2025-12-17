from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_card_membership_db(card_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO card_assignees (card_id, user_id)
            VALUES (%s, %s)
            RETURNING card_id, user_id;
        """, (card_id, user_id))
        row = cur.fetchone()
        conn.commit()

        return {
            "message": "User assigned to card successfully",
            "data": row
        }, 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {"error": "User already assigned to this card"}, 409

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()

def delete_card_membership_db(card_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            DELETE FROM card_assignees
            WHERE card_id = %s AND user_id = %s
            RETURNING card_id, user_id;
        """, (card_id, user_id))

        row = cur.fetchone()
        if not row:
            conn.rollback()
            return {"error": "User is not assigned to this card"}, 404

        conn.commit()

        return {
            "message": "User removed from card successfully",
            "data": row
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
