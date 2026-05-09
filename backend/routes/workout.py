import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, WorkoutPlan
from services.gemini_service import generate_text, safe_json

workout_bp = Blueprint("workout", __name__, url_prefix="/api/workout")


def _workout_prompt(user: User, extra: dict) -> str:
    age = extra.get("age", user.age)
    weight = extra.get("weight", user.weight)
    height = extra.get("height", user.height)
    goal = extra.get("goal", user.goal) or "general fitness"
    preference = extra.get("preference", user.preference) or "gym or home"

    return f"""
You are a fitness trainer. Generate a personalized WORKOUT PLAN in STRICT JSON only.

User:
- age: {age}
- weight_kg: {weight}
- height_cm: {height}
- fitness_goal: {goal}
- workout_preference: {preference}

Return JSON with this exact shape:
{{
  "title": "string",
  "days": [
    {{
      "day": "Day 1",
      "focus": "string",
      "exercises": [
        {{
          "name": "string",
          "sets": "e.g. 3",
          "reps": "e.g. 10-12",
          "duration": "e.g. 10 min (optional)",
          "instructions": "string"
        }}
      ]
    }}
  ],
  "notes": ["string"]
}}

Rules:
- Keep it beginner-friendly and safe.
- Use 3-5 exercises per day.
- 3-4 days total.
- No markdown, no extra text, JSON only.
""".strip()


@workout_bp.post("/generate")
@jwt_required()
def generate_workout():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json() or {}
    prompt = _workout_prompt(user, data)

    try:
        text = generate_text(prompt)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

    parsed = safe_json(text)
    content_to_store = json.dumps(parsed, ensure_ascii=False) if parsed is not None else text

    plan = WorkoutPlan(user_id=user_id, prompt=prompt, content=content_to_store)
    db.session.add(plan)
    db.session.commit()

    return jsonify({"plan": parsed if parsed is not None else {"raw": text}, "id": plan.id})


@workout_bp.get("/latest")
@jwt_required()
def latest_workout():
    user_id = int(get_jwt_identity())
    plan = (
        WorkoutPlan.query.filter_by(user_id=user_id)
        .order_by(WorkoutPlan.created_at.desc())
        .first()
    )
    if not plan:
        return jsonify({"plan": None})

    try:
        parsed = json.loads(plan.content)
        return jsonify({"plan": parsed, "id": plan.id, "created_at": plan.created_at.isoformat()})
    except Exception:
        return jsonify({"plan": {"raw": plan.content}, "id": plan.id, "created_at": plan.created_at.isoformat()})
