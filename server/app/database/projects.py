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
        sql = """
        SELECT 
            p.*,
            u.full_name AS owner_name,
            u.email AS owner_email,

            COUNT(DISTINCT b.id) AS boards_count,

            (COUNT(DISTINCT pm_all.user_id) + 1) AS members_count,

            -- UPDATED: use project role > board role > owner role
            CASE
                WHEN p.owner_id = %s THEN ro.id                    
                WHEN pm_user.role_id IS NOT NULL THEN pm_user.role_id    
                WHEN bm_user.role_id IS NOT NULL THEN bm_user.role_id    
                ELSE NULL
            END AS project_role_id,

            CASE
                WHEN p.owner_id = %s THEN ro.name                   
                WHEN pm_user.role_id IS NOT NULL THEN r.name       
                WHEN bm_user.role_id IS NOT NULL THEN br.name      
                ELSE NULL
            END AS role_name

        FROM projects p

        JOIN users u 
            ON u.id = p.owner_id

        LEFT JOIN boards b 
            ON b.project_id = p.id

        LEFT JOIN project_memberships pm_all
            ON pm_all.project_id = p.id

        LEFT JOIN project_memberships pm_user
            ON pm_user.project_id = p.id
           AND pm_user.user_id = %s

        LEFT JOIN roles r
            ON r.id = pm_user.role_id

        LEFT JOIN roles ro
            ON ro.name = 'project_owner'

        LEFT JOIN board_memberships bm_user
            ON bm_user.user_id = %s

        LEFT JOIN boards b2
            ON b2.id = bm_user.board_id
           AND b2.project_id = p.id

        LEFT JOIN roles br
            ON br.id = bm_user.role_id      

        WHERE 
            p.owner_id = %s
            OR pm_user.user_id = %s
            OR b2.id IS NOT NULL

        GROUP BY 
            p.id, 
            u.full_name, 
            u.email, 
            pm_user.role_id, 
            r.name, 
            ro.id, 
            ro.name,
            bm_user.role_id,     
            br.name             

        ORDER BY p.created_at DESC;
        """
        cur.execute(sql, (user_id, user_id, user_id, user_id, user_id, user_id))
        rows = cur.fetchall()
        conn.commit()

        cleaned_rows = []
        for row in rows:
            row = dict(row)
            cleaned_rows.append(row)

        for project in cleaned_rows:
            project_id = project["id"]
            cur.execute("""
                SELECT 
                    u.id AS user_id,
                    u.email,
                    u.full_name,
                    pm.role_id,
                    r.name AS role_name
                FROM project_memberships pm
                JOIN users u ON u.id = pm.user_id
                LEFT JOIN roles r ON r.id = pm.role_id
                WHERE pm.project_id = %s;
            """, (project_id,))

            members = cur.fetchall()
            cur.execute("""
                SELECT 
                    u.id AS user_id,
                    u.email,
                    u.full_name,
                    ro.id AS role_id,
                    ro.name AS role_name
                FROM users u
                LEFT JOIN roles ro ON ro.name = 'project_owner'
                WHERE u.id = %s;
            """, (project["owner_id"],))

            owner = cur.fetchone()
            if owner and owner["user_id"] not in [m["user_id"] for m in members]:
                members.insert(0, owner)  

            project["members"] = members

        return cleaned_rows, 200

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
