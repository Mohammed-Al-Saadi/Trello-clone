from flask import Flask, jsonify, request
from dotenv import load_dotenv
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from flask_cors import CORS
import hashlib, secrets, uuid, os, time
from routes.Auth import srp_register_bp,srp_start_bp, srp_verify_bp


load_dotenv()                                             
app = Flask(__name__)                                     
CORS(app, resources={r"/*": {"origins": ["http://localhost:4200", "http://127.0.0.1:4200"]}})
app.secret_key = os.getenv("SECRET_KEY")                  
get_db_connection()                                        

       
app.register_blueprint(srp_register_bp)
app.register_blueprint(srp_start_bp)
app.register_blueprint(srp_verify_bp)


if __name__ == '__main__':                                  
    print("✅ Flask is starting...")                        
    app.run(debug=True, port=8080)                         