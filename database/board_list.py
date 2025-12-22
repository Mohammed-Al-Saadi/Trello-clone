from database.config import get_db_connection, release_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def add_board_list(board_id: int, name: str, position: int = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if position is None:
            cur.execute("""
                SELECT COALESCE(MAX(position), -1) + 1 AS next_position
                FROM lists
                WHERE board_id = %s
            """, (board_id,))
            result = cur.fetchone()
            position = result["next_position"]

        cur.execute("""
            INSERT INTO lists (board_id, name, position)
            VALUES (%s, %s, %s)
            RETURNING id, name, position
        """, (board_id, name, position))

        new_list = cur.fetchone()
        conn.commit()

        return {
            "message": "New list added successfully",
            "list": new_list
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)

def get_lists_by_board_id(board_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, name, position
            FROM lists
            WHERE board_id = %s
            ORDER BY position ASC
        """, (board_id,))
        lists = cur.fetchall()
        cur.execute("""
            SELECT 
                id, 
                list_id, 
                title, 
                position, 
                created_by, 
                created_at,
                priority 
            FROM cards
            WHERE list_id IN (
                SELECT id FROM lists WHERE board_id = %s
            )
            ORDER BY position ASC, created_at ASC
        """, (board_id,))
        cards = cur.fetchall()
        cards_by_list = {}
        for card in cards:
            list_id = card["list_id"]
            if list_id not in cards_by_list:
                cards_by_list[list_id] = []
            cur.execute("""
                SELECT 
                    u.id AS user_id,
                    u.full_name,
                    u.email
                FROM card_assignees ca
                JOIN users u ON u.id = ca.user_id
                WHERE ca.card_id = %s
            """, (card["id"],))
            card_members = cur.fetchall()
            card["members"] = card_members  

            cur.execute("""
                SELECT due_date, status
                FROM card_contents
                WHERE card_id = %s
                LIMIT 1
            """, (card["id"],))
            due_date_row = cur.fetchone()

            card["due_date"] = due_date_row["due_date"] if due_date_row else None
            card["status"] = due_date_row["status"] if due_date_row else None

            cards_by_list[list_id].append(card)


        for list_obj in lists:
            list_id = list_obj["id"]
            list_obj["cards"] = cards_by_list.get(list_id, [])
        cur.execute("""
            (
                -- Project owner
                SELECT 
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    r.id AS role_id,
                    r.name AS role_name
                FROM projects p
                JOIN users u ON u.id = p.owner_id
                JOIN roles r ON r.name = 'project_owner'
                WHERE p.id = (SELECT project_id FROM boards WHERE id = %s)
            )
            UNION
            (
                -- Project-level members
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    r.id AS role_id,
                    r.name AS role_name
                FROM project_memberships pm
                JOIN users u ON u.id = pm.user_id
                JOIN roles r ON r.id = pm.role_id
                WHERE pm.project_id = (SELECT project_id FROM boards WHERE id = %s)
            )
            UNION
            (
                -- Board-level members
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    r.id AS role_id,
                    r.name AS role_name
                FROM board_memberships bm
                JOIN users u ON u.id = bm.user_id
                JOIN roles r ON r.id = bm.role_id
                WHERE bm.board_id = %s
            )
        """, (board_id, board_id, board_id))

        members = cur.fetchall()

        return {
            "message": "Lists, cards, and board members fetched successfully",
            "lists": lists,
            "members": members
        }, 200

    except psycopg2.Error as e:
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)


def update_list_positions(lists: list):
    if not isinstance(lists, list) or len(lists) == 0:
        return {"error": "Invalid payload format"}, 400
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        update_values = [(item["id"], item["position"]) for item in lists]
        query = """
            UPDATE lists AS l SET
                position = v.position
            FROM (VALUES %s) AS v(id, position)
            WHERE l.id = v.id
        """
        psycopg2.extras.execute_values(cur, query, update_values)
        conn.commit()
        return {
            "message": "List positions updated successfully",
            "updated": len(lists)
        }, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)


def update_list_name(list_id: int, new_name: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            UPDATE lists
            SET name = %s
            WHERE id = %s
            RETURNING id, name;
        """, (new_name, list_id))

        updated = cur.fetchone()
        conn.commit()

        if updated:
            return {
                "message": "List name updated successfully",
                "list": updated
            }, 200
        else:
            return {"error": "List not found"}, 404

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": e.pgerror or "Database error"}, 400

    finally:
        cur.close()
        release_db_connection(conn)


def delete_list(list_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            DELETE FROM lists
            WHERE id = %s
            RETURNING id;
        """, (list_id,))

        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return {"message": "List deleted successfully"}, 200
        else:
            return {"error": "List not found"}, 404

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        release_db_connection(conn)
