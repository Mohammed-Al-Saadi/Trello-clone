from database.config import get_db_connection, release_db_connection, release_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_new_board(project_id: int, name: str, position: int = 0, category: str = "General"):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO boards (project_id, name, position, category)
            VALUES (%s, %s, %s, %s)
            RETURNING id, project_id, name, position
        """, (project_id, name, position, category))

        new_board = cur.fetchone()
        conn.commit()

        return {
            "message": "New board added successfully",
            "board": dict(new_board)
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)

def get_boards_for_project(project_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT id FROM roles WHERE name = 'project_owner'")
        owner_role = cur.fetchone()
        if not owner_role:
            return {"error": "project_owner role missing"}, 500

        PROJECT_OWNER_ROLE_ID = owner_role["id"]
        PROJECT_OWNER_ROLE_NAME = "project_owner"
        cur.execute("""
            SELECT 
                p.owner_id,
                pm.role_id AS project_role_id,
                r.name AS project_role_name
            FROM projects p
            LEFT JOIN project_memberships pm
                ON pm.project_id = p.id
               AND pm.user_id = %s
            LEFT JOIN roles r
                ON r.id = pm.role_id
            WHERE p.id = %s
        """, (user_id, project_id))

        project = cur.fetchone()
        if not project:
            return {"error": "Project not found"}, 404

        is_owner = project["owner_id"] == user_id
        if is_owner:
            project_role_id = PROJECT_OWNER_ROLE_ID
            project_role_name = PROJECT_OWNER_ROLE_NAME

        elif project["project_role_id"]:
            project_role_id = project["project_role_id"]
            project_role_name = project["project_role_name"]

        else:
            project_role_id = None
            project_role_name = None
        if is_owner or (project_role_name and project_role_name.startswith("project_")):
            cur.execute("""
                SELECT 
                    b.*,
                    (
                        SELECT COUNT(DISTINCT u.user_id) FROM (
                            SELECT bm2.user_id
                            FROM board_memberships bm2
                            WHERE bm2.board_id = b.id
                            
                            UNION
                            
                            SELECT pm.user_id
                            FROM project_memberships pm
                            JOIN roles pr ON pr.id = pm.role_id
                            WHERE pm.project_id = b.project_id
                              AND pr.name LIKE 'project_%%'
                            
                            UNION
                            
                            SELECT p.owner_id
                            FROM projects p
                            WHERE p.id = b.project_id
                        ) u
                    ) AS members_count,
                    
                    bm.role_id AS board_role_id,
                    r.name AS board_role_name

                FROM boards b
                LEFT JOIN board_memberships bm 
                    ON bm.board_id = b.id
                   AND bm.user_id = %s

                LEFT JOIN roles r
                    ON r.id = bm.role_id

                WHERE b.project_id = %s
                ORDER BY b.position ASC
            """, (user_id, project_id))

        else:
            cur.execute("""
                SELECT 
                    b.*,
                    (
                        SELECT COUNT(DISTINCT u.user_id) FROM (
                            SELECT bm2.user_id
                            FROM board_memberships bm2
                            WHERE bm2.board_id = b.id
                            
                            UNION
                            
                            SELECT pm.user_id
                            FROM project_memberships pm
                            JOIN roles pr ON pr.id = pm.role_id
                            WHERE pm.project_id = b.project_id
                              AND pr.name LIKE 'project_%%'
                            
                            UNION
                            
                            SELECT p.owner_id
                            FROM projects p
                            WHERE p.id = b.project_id
                        ) u
                    ) AS members_count,

                    bm.role_id AS board_role_id,
                    r.name AS board_role_name

                FROM boards b
                JOIN board_memberships bm 
                    ON bm.board_id = b.id
                   AND bm.user_id = %s

                LEFT JOIN roles r
                    ON r.id = bm.role_id

                WHERE b.project_id = %s
                ORDER BY b.position ASC
            """, (user_id, project_id))

        boards = cur.fetchall()
        conn.commit()

        for board in boards:

            cur.execute("""
                SELECT DISTINCT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    role_data.role_id,
                    role_data.role_name

                FROM users u
                JOIN (
                    -- Board members
                    SELECT bm.user_id, bm.role_id, r.name AS role_name
                    FROM board_memberships bm
                    LEFT JOIN roles r ON r.id = bm.role_id
                    WHERE bm.board_id = %s

                    UNION

                    -- Project-level roles
                    SELECT pm.user_id, pm.role_id, r.name AS role_name
                    FROM project_memberships pm
                    JOIN roles r ON r.id = pm.role_id
                    WHERE pm.project_id = %s
                      AND r.name LIKE 'project_%%'

                    UNION

                    -- Project Owner
                    SELECT p.owner_id AS user_id,
                           (SELECT id FROM roles WHERE name='project_owner'),
                           'project_owner'
                    FROM projects p
                    WHERE p.id = %s
                ) AS role_data
                    ON role_data.user_id = u.id
            """, (board["id"], project_id, project_id))

            board_members = cur.fetchall()
            board["members"] = [dict(m) for m in board_members]

        results = []
        for board in boards:
            b = dict(board)

            if is_owner:
                b["user_role_id"] = PROJECT_OWNER_ROLE_ID
                b["role_name"] = PROJECT_OWNER_ROLE_NAME

            elif project_role_name and project_role_name.startswith("project_"):
                b["user_role_id"] = project_role_id
                b["role_name"] = project_role_name

            else:
                b["user_role_id"] = b["board_role_id"]
                b["role_name"] = b["board_role_name"]

            del b["board_role_id"]
            del b["board_role_name"]

            results.append(b)

        return results, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": str(e)}, 400

    finally:
        cur.close()
        release_db_connection(conn)


def update_board(board_id: int, name: str, category: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            UPDATE boards
            SET name = %s,
                category = %s
            WHERE id = %s
            RETURNING id
        """, (name, category, board_id)) 

        updated_board = cur.fetchone()

        if not updated_board:
            return {"error": "Board not found"}, 404

        conn.commit()

        return {
            "message": "Board updated successfully",
            "board": dict(updated_board)
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)


def delete_board(project_id: int, board_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            DELETE FROM boards
            WHERE id = %s AND project_id = %s
            RETURNING id
        """, (board_id, project_id))

        deleted = cur.fetchone()

        if not deleted:
            return {"error": "Board not found"}, 404

        conn.commit()
        return {"message": "Board deleted successfully"}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)
