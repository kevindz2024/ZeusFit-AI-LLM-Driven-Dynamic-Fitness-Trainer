from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, ChatHistory, User
from services.gemini_service import generate_text

chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/chatbot")


def _chat_prompt(user: User, message: str) -> str:
    return f"""
You are ZeusFit AI, a friendly fitness chatbot.
Answer briefly and clearly. If user asks unsafe medical stuff, suggest consulting a professional.

User profile:
- name: {user.name}
- age: {user.age}
- weight_kg: {user.weight}
- height_cm: {user.height}
- goal: {user.goal}
- preference: {user.preference}

User message:
{message}
""".strip()


@chatbot_bp.post("/message")
@jwt_required()
def chatbot_message():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"message": "Message is required."}), 400

    db.session.add(ChatHistory(user_id=user_id, role="user", message=message))
    db.session.commit()

    prompt = _chat_prompt(user, message)
    try:
        reply = generate_text(prompt)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

    db.session.add(ChatHistory(user_id=user_id, role="assistant", message=reply))
    db.session.commit()

    return jsonify({"reply": reply})


@chatbot_bp.get("/history")
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    rows = (
        ChatHistory.query.filter_by(user_id=user_id)
        .order_by(ChatHistory.created_at.asc())
        .limit(50)
        .all()
    )
    return jsonify(
        {
            "messages": [
                {
                    "id": r.id,
                    "role": r.role,
                    "message": r.message,
                    "created_at": r.created_at.isoformat(),
                }
                for r in rows
            ]
        }
    )
