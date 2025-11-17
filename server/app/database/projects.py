from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_new_project(name: str, description: str, owner_id: int, category:str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO projects (name, description, owner_id, category)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (name, description, owner_id, category ))

        new_project = cur.fetchone()
        conn.commit()

        return {
            "message": "New project added successfully",
            "project": new_project
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()


def get_all_project_for_user(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                p.*,

                -- Owner info
                u.full_name AS owner_name,
                u.email AS owner_email,

                -- Number of boards in the project
                COUNT(DISTINCT b.id) AS boards_count,

                -- Members count (unique project members + owner)
                (COUNT(DISTINCT pm.user_id) + 1) AS members_count

            FROM projects p

            JOIN users u 
                ON u.id = p.owner_id

            LEFT JOIN boards b 
                ON b.project_id = p.id

            LEFT JOIN project_memberships pm 
                ON pm.project_id = p.id

            WHERE p.owner_id = %s
               OR pm.user_id = %s

            GROUP BY p.id, u.full_name, u.email
            ORDER BY p.created_at DESC
        """, (user_id, user_id))

        rows = cur.fetchall()
        conn.commit()

        return [dict(row) for row in rows], 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()


def delete_project(project_id: int, owner_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            DELETE FROM projects
            WHERE id = %s AND owner_id = %s
            RETURNING id
        """, (project_id, owner_id))

        deleted = cur.fetchone()

        if not deleted:
            return {"error": "Project not found or not authorized"}, 404

        conn.commit()
        return {"message": "Project deleted successfully"}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()


def update_project(project_id: int, owner_id: int, name: str, description: str, category: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            UPDATE projects
            SET name = %s,
                description = %s,
                category = %s
            WHERE id = %s AND owner_id = %s
            RETURNING id, name, description, category, created_at
        """, (name, description, category, project_id, owner_id))

        updated_project = cur.fetchone()

        if not updated_project:
            return {"error": "Project not found or not authorized"}, 404

        conn.commit()

        return {
            "message": "Project updated successfully",
            "project": dict(updated_project)
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
