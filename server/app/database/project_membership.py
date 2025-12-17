from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_project_membership_db(project_id: int, role_id: int, email: str, added_by: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            return {"error": "User does not exist or is not registered"}, 404

        user_id = user["id"]
        cur.execute("""
            INSERT INTO project_memberships (project_id, user_id, role_id, added_by)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """, (project_id, user_id, role_id, added_by))

        row = cur.fetchone()
        conn.commit()
        return {
            "message": "New owner added successfully!",
            "data": row
        }, 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {"error": "User already added to this project"}, 409

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()



def delete_project_membership_db(project_id: int, user_id: int):
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

def update_project_membership_role_db(project_id: int, user_id: int, new_role_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT * FROM project_memberships
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))

        member = cur.fetchone()

        if not member:
            return {"error": "Membership not found for this user and project"}, 404

        cur.execute("""
            UPDATE project_memberships
            SET role_id = %s
            WHERE project_id = %s AND user_id = %s
            RETURNING *;
        """, (new_role_id, project_id, user_id))

        updated = cur.fetchone()
        conn.commit()

        return {
            "message": "Role updated successfully",
            "data": updated
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
