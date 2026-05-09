from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, ProgressLog, User

progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


def _bmi(weight_kg: float, height_cm: float) -> float:
    if not height_cm or height_cm <= 0:
        return 0.0
    h_m = height_cm / 100.0
    return round(weight_kg / (h_m * h_m), 2)


@progress_bp.post("")
@jwt_required()
def add_progress():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json() or {}
    weight = data.get("weight")
    if weight is None:
        return jsonify({"message": "Weight is required (kg)."}), 400

    try:
        weight = float(weight)
    except Exception:
        return jsonify({"message": "Weight must be a number."}), 400

    height_cm = float(data.get("height", user.height or 0) or 0)
    bmi_value = _bmi(weight, height_cm)

    row = ProgressLog(user_id=user_id, weight=weight, bmi=bmi_value, created_at=datetime.utcnow())
    db.session.add(row)

    # Keep user's latest weight/height updated for better AI prompts
    user.weight = weight
    if data.get("height") is not None:
        user.height = float(data.get("height"))

    db.session.commit()
    return jsonify(
        {
            "progress": {
                "id": row.id,
                "weight": row.weight,
                "bmi": row.bmi,
                "created_at": row.created_at.isoformat(),
            }
        }
    ), 201


@progress_bp.get("")
@jwt_required()
def get_progress():
    user_id = int(get_jwt_identity())
    rows = (
        ProgressLog.query.filter_by(user_id=user_id)
        .order_by(ProgressLog.created_at.asc())
        .all()
    )
    return jsonify(
        {
            "items": [
                {
                    "id": r.id,
                    "weight": r.weight,
                    "bmi": r.bmi,
                    "created_at": r.created_at.isoformat(),
                }
                for r in rows
            ]
        }
    )
