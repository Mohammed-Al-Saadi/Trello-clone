from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2


def add_card_content(card_id: int, content_html: str = None, due_date: str = None, status: bool = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        updated_fields = []
        if content_html is not None:
            updated_fields.append("content")
        if due_date is not None:
            updated_fields.append("due date")
        if status is not None:
            updated_fields.append("status")

        insert_query = """
            INSERT INTO card_contents (card_id, content_html, due_date, status)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (card_id)
            DO UPDATE SET 
                content_html = COALESCE(EXCLUDED.content_html, card_contents.content_html),
                due_date = EXCLUDED.due_date,
                status = COALESCE(EXCLUDED.status, card_contents.status),
                updated_at = CURRENT_TIMESTAMP
            RETURNING card_id, content_html, due_date, status, updated_at;
        """
        cur.execute(insert_query, (card_id, content_html, due_date, status))
        new_content = cur.fetchone()
        conn.commit()

        if not updated_fields:
            message = "No changes were made"
        elif len(updated_fields) == 1:
            message = f"{updated_fields[0].capitalize()} updated successfully"
        else:
            field_text = ", ".join(updated_fields[:-1]) + f" and {updated_fields[-1]}"
            message = f"{field_text.capitalize()} updated successfully"

        return {
            "message": message,
            "content": new_content
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()



def get_card_content(card_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT card_id, content_html, updated_at, due_date, status
            FROM card_contents
            WHERE card_id = %s
        """, (card_id,))
        content = cur.fetchone()

        cur.execute("""
            SELECT 
                c.id,
                c.card_id,
                c.user_id,
                u.full_name AS user_name,
                c.comment,
                c.created_at
            FROM card_comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.card_id = %s
            ORDER BY c.created_at ASC
        """, (card_id,))
        comments = cur.fetchall()

        return {
            "content": content if content else None,
            "comments": comments,
            "message": "Success"
        }, 200

    except psycopg2.Error as e:
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()



def add_comment(card_id: int, user_id: int, comment: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO card_comments (card_id, user_id, comment)
            VALUES (%s, %s, %s)
            RETURNING id, card_id, user_id, comment, created_at;
        """, (card_id, user_id, comment))

        new_comment = cur.fetchone()
        conn.commit()

        return {
            "message": "Comment added successfully",
            "comment": new_comment
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {
            "error": f"Database error: {e.pgerror or str(e)}"
        }, 400

    finally:
        cur.close()
        conn.close()


def delete_comment(comment_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            DELETE FROM card_comments
            WHERE id = %s
            RETURNING id;
        """, (comment_id,))

        deleted = cur.fetchone()

        if not deleted:
            return {"error": "Comment not found"}, 404

        conn.commit()

        return {"message": "Comment deleted successfully"}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {
            "error": f"Database error: {e.pgerror or str(e)}"
        }, 400

    finally:
        cur.close()
        conn.close()


def get_comments(card_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, card_id, user_id, comment, created_at
            FROM card_comments
            WHERE card_id = %s
            ORDER BY created_at ASC;
        """, (card_id,))

        comments = cur.fetchall()
        conn.commit()

        return {"comments": comments}, 200

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()
