from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2



def add_new_board(project_id: int, name: str, position: int = 0):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO boards (project_id, name, position)
            VALUES (%s, %s, %s)
            RETURNING id, project_id, name, position
        """, (project_id, name, position))

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
        conn.close()
        

def get_boards_for_project(project_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Step 1: check if user is owner
        cur.execute("""
            SELECT owner_id 
            FROM projects 
            WHERE id = %s
        """, (project_id,))
        
        project = cur.fetchone()
        if not project:
            return {"error": "Project not found"}, 404
        
        is_owner = project["owner_id"] == user_id

        # Step 2: Owner gets ALL boards
        if is_owner:
            cur.execute("""
                SELECT *
                FROM boards
                WHERE project_id = %s
                ORDER BY position ASC
            """, (project_id,))
        else:
            # Step 3: Not owner → get only boards where user is member
            cur.execute("""
                SELECT b.*
                FROM boards b
                JOIN project_memberships pm 
                    ON pm.board_id = b.id
                WHERE b.project_id = %s
                  AND pm.user_id = %s
                ORDER BY b.position ASC
            """, (project_id, user_id))

        rows = cur.fetchall()
        conn.commit()

        return [dict(row) for row in rows], 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()





def update_board(board_id: int, name: str, position: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            UPDATE boards
            SET name = %s,
                position = %s
            WHERE id = %s
            RETURNING id, project_id, name, position
        """, (name, position, board_id))

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
        conn.close()



def delete_board(board_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            DELETE FROM boards
            WHERE id = %s
            RETURNING id
        """, (board_id,))

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
        conn.close()
