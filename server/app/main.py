from flask import Flask, jsonify, request
from dotenv import load_dotenv
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from flask_cors import CORS
import hashlib, secrets, uuid, os, time
from routes.auth import srp_register_bp,srp_start_bp, srp_verify_bp, check_auth_bp, logout_bp

from routes.projects import add_projects_bp, get_projects_bp,delete_projects_bp ,update_projects_bp
from routes.boards import add_boards_bp, get_boards_bp
from routes.project_membership import add_membership_bp
from routes.get_roles import get_roles_bp
load_dotenv()                                             
app = Flask(__name__)                                     
from flask_cors import CORS
CORS(
    app,
    supports_credentials=True,  
    origins=["http://localhost:4200", "http://127.0.0.1:4200"]
)
app.secret_key = os.getenv("SECRET_KEY")                  
get_db_connection()                                        

       
app.register_blueprint(srp_register_bp)
app.register_blueprint(srp_start_bp)
app.register_blueprint(srp_verify_bp)
app.register_blueprint(check_auth_bp)
app.register_blueprint(logout_bp)
app.register_blueprint(add_projects_bp)
app.register_blueprint(get_projects_bp)

app.register_blueprint(delete_projects_bp)
app.register_blueprint(update_projects_bp)
app.register_blueprint(add_boards_bp)
app.register_blueprint(get_boards_bp)
app.register_blueprint(add_membership_bp)
app.register_blueprint(get_roles_bp)



if __name__ == '__main__':                                  
    print("✅ Flask is starting...")                        
    app.run(debug=True, port=8080)                         