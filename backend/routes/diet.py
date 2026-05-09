import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, DietPlan
from services.gemini_service import generate_text, safe_json

diet_bp = Blueprint("diet", __name__, url_prefix="/api/diet")


def _diet_prompt(user: User, extra: dict) -> str:
    age = extra.get("age", user.age)
    weight = extra.get("weight", user.weight)
    height = extra.get("height", user.height)
    goal = extra.get("goal", user.goal) or "general fitness"
    preference = extra.get("preference", user.preference) or "balanced"

    return f"""
You are a nutrition assistant. Generate a simple 1-day DIET PLAN in STRICT JSON only.

User:
- age: {age}
- weight_kg: {weight}
- height_cm: {height}
- fitness_goal: {goal}
- diet_preference: {preference}

Return JSON with this exact shape:
{{
  "title": "string",
  "breakfast": ["string", "string"],
  "lunch": ["string", "string"],
  "dinner": ["string", "string"],
  "water_intake_liters": "e.g. 2.5",
  "notes": ["string"]
}}

Rules:
- Keep it budget-friendly and beginner-friendly.
- Use common foods (India-friendly is okay).
- No markdown, no extra text, JSON only.
""".strip()


@diet_bp.post("/generate")
@jwt_required()
def generate_diet():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json() or {}
    prompt = _diet_prompt(user, data)

    try:
        text = generate_text(prompt)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

    parsed = safe_json(text)
    content_to_store = json.dumps(parsed, ensure_ascii=False) if parsed is not None else text

    plan = DietPlan(user_id=user_id, prompt=prompt, content=content_to_store)
    db.session.add(plan)
    db.session.commit()

    return jsonify({"plan": parsed if parsed is not None else {"raw": text}, "id": plan.id})


@diet_bp.get("/latest")
@jwt_required()
def latest_diet():
    user_id = int(get_jwt_identity())
    plan = (
        DietPlan.query.filter_by(user_id=user_id)
        .order_by(DietPlan.created_at.desc())
        .first()
    )
    if not plan:
        return jsonify({"plan": None})

    try:
        parsed = json.loads(plan.content)
        return jsonify({"plan": parsed, "id": plan.id, "created_at": plan.created_at.isoformat()})
    except Exception:
        return jsonify({"plan": {"raw": plan.content}, "id": plan.id, "created_at": plan.created_at.isoformat()})
