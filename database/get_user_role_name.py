import psycopg2
from psycopg2.extras import RealDictCursor
from database.config import get_db_connection, release_db_connection

def get_user_role_name_db(user_id: int, project_id: int) -> str:
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        sql = """
        SELECT 
            CASE
                WHEN p.owner_id = %s THEN ro.name
                WHEN pm.role_id IS NOT NULL THEN r.name
                WHEN bm.role_id IS NOT NULL THEN br.name
                ELSE 'No Role'
            END AS role_name
        FROM projects p

        LEFT JOIN project_memberships pm 
            ON pm.project_id = p.id AND pm.user_id = %s
        LEFT JOIN roles r 
            ON r.id = pm.role_id

        LEFT JOIN board_memberships bm 
            ON bm.user_id = %s
        LEFT JOIN boards b 
            ON b.id = bm.board_id AND b.project_id = p.id
        LEFT JOIN roles br 
            ON br.id = bm.role_id

        LEFT JOIN roles ro 
            ON ro.name = 'project_owner'

        WHERE p.id = %s
        LIMIT 1;
        """

        cur.execute(sql, (user_id, user_id, user_id, project_id))
        row = cur.fetchone()
        conn.commit()

        return (row["role_name"] if row and row.get("role_name") else "No Role")

    except psycopg2.Error:
        conn.rollback()
        return "No Role"

    finally:
        cur.close()
        release_db_connection(conn)
