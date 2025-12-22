from flask import Flask, jsonify, request
from dotenv import load_dotenv
from database.config import  close_db_pool
from flask_cors import CORS
import  os, atexit
from routes.get_roles import get_roles_bp
from routes.cards import bp as cards_bp
from routes.auth import bp as auth_bp
from routes.board_membership import bp as board_membership_bp
from routes.boards import bp as boards_bp
from routes.card_content import bp as card_content_bp
from routes.project_membership import bp as project_membership_bp
from routes.card_membership import  bp as  card_membership_bp
from routes.board_list import bp as board_list_bp
from routes.projects import bp as projects_bp
load_dotenv()

app = Flask(__name__)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

CORS(
    app,
    supports_credentials=True,
    origins=allowed_origins
)

@app.route('/')
def home():
    return "Hello from Flask!"


app.register_blueprint(board_list_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(board_membership_bp)
app.register_blueprint(boards_bp)
app.register_blueprint(card_content_bp)
app.register_blueprint(card_membership_bp)
app.register_blueprint(cards_bp)
app.register_blueprint(project_membership_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(get_roles_bp)

if __name__ == '__main__':
    print("✅ Flask is starting...")
    atexit.register(close_db_pool)
    app.run(debug=True, port=8080)