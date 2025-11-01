from database.config import get_db_connection
from psycopg2 import Binary
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any


def register_srp_user(full_name: str, email: str, salt_bytes: bytes, verifier_bytes: bytes):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO users (full_name, email, salt, verifier)
            VALUES (%s, %s, %s, %s)
        """, (full_name, email, Binary(salt_bytes), Binary(verifier_bytes)))
        conn.commit()
        return {"message": "SRP registration successful!"}, 201
    except psycopg2.Error as e:
        conn.rollback()
        return {"error": str(e)}, 400
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
