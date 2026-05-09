import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from models import db
from routes.auth import auth_bp
from routes.workout import workout_bp
from routes.diet import diet_bp
from routes.chatbot import chatbot_bp
from routes.progress import progress_bp
from routes.planner import planner_bp


def create_app():
    # Always load backend/.env regardless of where Flask is started from.
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path)

    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///zeusfit.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(workout_bp)
    app.register_blueprint(diet_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(planner_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/debug/gemini")
    def debug_gemini():
        # Safe diagnostics: does NOT return the full key.
        key = os.getenv("GEMINI_API_KEY") or ""
        return jsonify(
            {
                "has_key": bool(key),
                "key_length": len(key),
                "key_last4": key[-4:] if len(key) >= 4 else key,
            }
        )

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
