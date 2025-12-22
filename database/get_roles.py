
from database.config import get_db_connection, release_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2

def get_all_roles_db():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, name, permissions, is_app_role 
            FROM roles
            ORDER BY id ASC
        """)
        
        rows = cur.fetchall()
        roles = [dict(row) for row in rows]
        return roles, 200

    except psycopg2.Error as e:
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400
    
    finally:
        cur.close()
        release_db_connection(conn)
