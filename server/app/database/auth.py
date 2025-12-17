from database.config import get_db_connection
from psycopg2 import Binary
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any
import psycopg2


def register_srp_user(full_name: str, email: str, salt_bytes: bytes, verifier_bytes: bytes):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id FROM roles WHERE name = 'app_user'")
        app_role = cur.fetchone()
        app_role_id = app_role["id"] if app_role else None

        cur.execute("""
            INSERT INTO users (full_name, email, salt, verifier, app_role_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, full_name, email, app_role_id, created_at
        """, (full_name, email, Binary(salt_bytes), Binary(verifier_bytes), app_role_id))

        new_user = cur.fetchone()
        conn.commit()

        return {
            "message": "🎉 Registration successful! Welcome aboard!",
            "user": new_user
        }, 201

    except psycopg2.Error as e:
        conn.rollback()
        return {"error": f"Database error: {e.pgerror or str(e)}"}, 400

    finally:
        cur.close()
        conn.close()

def get_user_salt_verifier(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)  
    try:
        cur.execute("SELECT salt, verifier FROM users WHERE email=%s", (email,))
        row = cur.fetchone()  
        return row
    finally:
        cur.close()
        conn.close()

def get_user_email(email: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT id, email, app_role_id, full_name FROM users WHERE email = %s
        """, (email,))
        user = cur.fetchone()

        if user:
            return {
                "email": user["email"],
                "id": user["id"],
                "full_name": user["full_name"],
                "app_role_id": user["app_role_id"]

            }
        else:
            return None
    except psycopg2.Error as e:
        conn.rollback()
        return {"error": str(e)}, 400
    finally:
        cur.close()
        conn.close()



