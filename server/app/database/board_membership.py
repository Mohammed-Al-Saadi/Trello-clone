from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_board_membership_db(board_id: int, role_id: int, email: str, added_by: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT project_id FROM boards WHERE id = %s", (board_id,))
        board = cur.fetchone()

        if not board:
            return {"error": "Board not found"}, 404

        project_id = board["project_id"]

        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if not user:
            return {"error": "User does not exist or is not registered"}, 404

        user_id = user["id"]
        cur.execute("""
            SELECT 1 FROM project_memberships 
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))

        if cur.fetchone():
            return {
                "error": "User is already a member of the project — cannot be added to board separately"
            }, 400

        cur.execute("""
            INSERT INTO board_memberships (board_id, user_id, role_id, added_by)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """, (board_id, user_id, role_id, added_by))

        row = cur.fetchone()
        conn.commit()

        return {
            "message": "New board member added successfully!",
            "data": row
        }, 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {"error": "User already added to this board"}, 409

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()

def delete_board_membership_db(project_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            DELETE FROM project_memberships
            WHERE project_id = %s AND user_id = %s
            RETURNING *;
        """, (project_id, user_id))

        deleted_row = cur.fetchone()

        if not deleted_row:
            return {"error": "No membership found for this project and role"}, 404

        conn.commit()
        return {"message": "Membership deleted successfully", "deleted": deleted_row}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()


def update_board_member_role_db(board_id: int, user_id: int, new_role_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT id FROM roles WHERE id = %s", (new_role_id,))
        role = cur.fetchone()
        if not role:
            return {"error": "Role does not exist"}, 404
        cur.execute("""
            UPDATE board_memberships
            SET role_id = %s
            WHERE board_id = %s AND user_id = %s
            RETURNING *;
        """, (new_role_id, board_id, user_id))

        updated = cur.fetchone()
        conn.commit()

        return {
            "message": "Role updated successfully",
            "updated": updated
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {
            "error": f"Database error: {e.pgerror or str(e)}"
        }, 400

    finally:
        cur.close()
        conn.close()


def delete_board_member_db(board_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            DELETE FROM board_memberships
            WHERE board_id = %s AND user_id = %s
            RETURNING *;
        """, (board_id, user_id))

        deleted_row = cur.fetchone()
        conn.commit()

        return {
            "message": "Board member removed successfully",
            "deleted": deleted_row
        }, 200
    except psycopg2.Error as e:
        conn.rollback()
        return {
            "error": f"Database error: {e.pgerror or str(e)}"
        }, 400

    finally:
        cur.close()
        conn.close()
