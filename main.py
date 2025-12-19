from flask import Flask, jsonify, request
from dotenv import load_dotenv
from database.config import get_db_connection
from psycopg2.extras import RealDictCursor
import psycopg2
from flask_cors import CORS
import hashlib, secrets, uuid, os, time
from routes.auth import srp_register_bp,srp_start_bp, srp_verify_bp, check_auth_bp, logout_bp
from routes.projects import add_projects_bp, get_projects_bp,delete_projects_bp ,update_projects_bp
from routes.boards import add_boards_bp, get_boards_bp,delete_board_bp, edit_boards_bp
from routes.project_membership import add_project_membership_bp,delete_project_membership_bp, edit_project_membership_bp
from routes.board_membership import add_board_membership_bp, update_board_membership_bp, delete_board_membership_bp
from routes.get_roles import get_roles_bp
from routes.cards import add_card_to_list_bp, update_card_details_bp,  delete_card_routes, move_cards_in_same_list_bp, move_card_to_other_list_bp
from routes.card_content import add_card_content_bp, get_card_content_routes, add_comments_bp, delete_comments_bp

from routes.card_membership import add_card_membership_bp,delete_card_membership_bp
from routes.board_list import  add_lists_bp,delete_board_lists_bp, get_board_lists_bp, update_board_lists_position_bp,update_list_name_bp
load_dotenv()                                             
app = Flask(__name__)                                     
from flask_cors import CORS
CORS(
    app,
    supports_credentials=True,  
    origins=["http://localhost:4200", "http://127.0.0.1:8080","https://tavolopro.netlify.app", "https://www.tavolopro.live","https://tavolopro.live","https://api.tavolopro.live/"]
)
app.secret_key = os.getenv("SECRET_KEY")
                  
get_db_connection()                                        


@app.route('/')
def home():
    return "Hello from Flask!"
       
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
app.register_blueprint(add_project_membership_bp)
app.register_blueprint(get_roles_bp)
app.register_blueprint(delete_project_membership_bp)
app.register_blueprint(add_board_membership_bp)
app.register_blueprint(delete_board_bp)
app.register_blueprint(edit_boards_bp)
app.register_blueprint(add_lists_bp)
app.register_blueprint(get_board_lists_bp)
app.register_blueprint(update_board_lists_position_bp)
app.register_blueprint(update_list_name_bp)
app.register_blueprint(edit_project_membership_bp)
app.register_blueprint(update_board_membership_bp)
app.register_blueprint(delete_board_membership_bp)
app.register_blueprint(delete_board_lists_bp)
app.register_blueprint(add_card_to_list_bp)
app.register_blueprint(delete_card_routes)
app.register_blueprint(move_cards_in_same_list_bp)

app.register_blueprint(move_card_to_other_list_bp)
app.register_blueprint(add_card_content_bp)
app.register_blueprint(get_card_content_routes)

app.register_blueprint(add_card_membership_bp)
app.register_blueprint(delete_card_membership_bp)
app.register_blueprint(update_card_details_bp)

app.register_blueprint(add_comments_bp)
app.register_blueprint(delete_comments_bp)



if __name__ == '__main__':                                  
    print("✅ Flask is starting...")                        
    app.run(debug=True, port=8080)                         