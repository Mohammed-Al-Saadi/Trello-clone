from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_membership_db(project_id: int, board_id: int, role_id: int, email: str, added_by: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            return {"error": "User does not exist or is not registered"}, 404

        user_id = user["id"]   # ✅ FIXED

        cur.execute("""
            INSERT INTO project_memberships (project_id, board_id, user_id, role_id, added_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *;
        """, (project_id, board_id, user_id, role_id, added_by))

        row = cur.fetchone()
        conn.commit()
        return row, 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {"error": "User already added to this board in this project"}, 409

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
