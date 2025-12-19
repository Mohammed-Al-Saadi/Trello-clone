import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

if os.getenv("APP_ENV", "").lower() == "local":
    load_dotenv()

def get_db_connection():
    """Create and return a PostgreSQL connection."""
    try:

        env = os.getenv("APP_ENV", "").lower()
        if env == "local":
            conn = psycopg2.connect(
                dbname=os.getenv("DB_NAME_LOCAL"),
                user=os.getenv("DB_USER_LOCAL"),
                password=os.getenv("DB_PASSWORD_LOCAL"),
                host=os.getenv("DB_HOST_LOCAL"),
                port=os.getenv("DB_PORT_LOCAL"),
            )
            print("✅ Connected to LOCAL database!")
        else:
            conn = psycopg2.connect(
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                sslmode="require"
            )
            print("✅ Connected to PRODUCTION database!")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        raise
