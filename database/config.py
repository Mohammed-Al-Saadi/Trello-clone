import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
from dotenv import load_dotenv
import os

if os.getenv("APP_ENV", "").lower() == "local":
    load_dotenv()

_db_pool = None

def get_db_pool():
    global _db_pool
    if _db_pool is None:
        env = os.getenv("APP_ENV", "").lower()
        if env == "local":
            _db_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dbname=os.getenv("DB_NAME_LOCAL"),
                user=os.getenv("DB_USER_LOCAL"),
                password=os.getenv("DB_PASSWORD_LOCAL"),
                host=os.getenv("DB_HOST_LOCAL"),
                port=os.getenv("DB_PORT_LOCAL"),
            )
            print("✅ LOCAL database connection pool initialized!")
        else:
            _db_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                sslmode="require"
            )
            print("✅ PRODUCTION database connection pool initialized!")
    return _db_pool

def get_db_connection():
    """Get a connection from the pool."""
    try:
        pool = get_db_pool()
        conn = pool.getconn()
        return conn
    except psycopg2.Error as e:
        print(f"❌ Failed to get connection from pool: {e}")
        raise

def release_db_connection(conn):
    """Release a connection back to the pool."""
    try:
        pool = get_db_pool()
        pool.putconn(conn)
    except Exception as e:
        print(f"❌ Failed to release connection: {e}")

def close_db_pool():
    """Close all connections in the pool."""
    global _db_pool
    if _db_pool:
        _db_pool.closeall()
        print("✅ Database connection pool closed!")
