import json
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import db, PlannerExerciseProgress, WorkoutProfile


planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")

DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
WEEKEND_MODES = ["strength", "cardio", "mobility", "rest"]


def _default_weekly_split():
    return {
        "monday": "push",
        "tuesday": "pull",
        "wednesday": "legs",
        "thursday": "core",
        "friday": "full-body",
        "saturday": "strength",
        "sunday": "rest",
    }


def _get_profile(user_id: int) -> WorkoutProfile:
    row = WorkoutProfile.query.filter_by(user_id=user_id).first()
    if row:
        return row
    row = WorkoutProfile(user_id=user_id, weekly_split_json=json.dumps(_default_weekly_split()))
    db.session.add(row)
    db.session.commit()
    return row


def _load_weekly_split(profile: WorkoutProfile):
    try:
        split = json.loads(profile.weekly_split_json or "{}")
        if not isinstance(split, dict):
            return _default_weekly_split()
        base = _default_weekly_split()
        base.update({k: v for k, v in split.items() if k in DAY_KEYS})
        return base
    except Exception:
        return _default_weekly_split()


def _slug(s: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in s).strip("-")


def _exercise(ex_id: str, name: str, sets: str, reps: str, weight: str, rest_seconds: int, muscle_groups):
    return {
        "id": ex_id,
        "name": name,
        "sets": sets,
        "reps": reps,
        "weight": weight,
        "restSeconds": int(rest_seconds),
        "muscleGroups": muscle_groups,
    }


def _plan_for_type(day_key: str, workout_type: str):
    """
    Beginner-friendly static generator.
    Keeps the backend lightweight and deterministic (no AI call needed).
    """
    title = "Workout Plan"
    tip = "Warm up 5 minutes, keep form strict, and stop if you feel pain."

    if workout_type == "rest":
        return {
            "title": "Rest & Recovery",
            "day": day_key,
            "focus": "Recovery",
            "estimatedMinutes": 15,
            "tip": "Hydrate, take a short walk, and do light stretching.",
            "isRestDay": True,
            "exercises": [],
        }

    # Templates (3-6 exercises each) with muscle groups for filtering.
    templates = {
        "push": {
            "focus": "Chest • Shoulders • Triceps",
            "estimatedMinutes": 45,
            "exercises": [
                ("Push-ups", "3", "8-12", "Bodyweight", 60, ["chest", "triceps", "shoulders"]),
                ("Dumbbell Bench Press", "3", "10-12", "Light", 75, ["chest", "triceps"]),
                ("Overhead Press", "3", "8-10", "Light", 90, ["shoulders", "triceps"]),
                ("Lateral Raises", "3", "12-15", "Light", 60, ["shoulders"]),
                ("Triceps Rope Pushdown", "3", "10-12", "Light", 60, ["triceps"]),
            ],
        },
        "pull": {
            "focus": "Back • Biceps",
            "estimatedMinutes": 45,
            "exercises": [
                ("Lat Pulldown", "3", "10-12", "Light", 75, ["back"]),
                ("Seated Cable Row", "3", "10-12", "Light", 75, ["back"]),
                ("Dumbbell Row", "3", "8-10", "Light", 90, ["back"]),
                ("Face Pulls", "3", "12-15", "Light", 60, ["rear delts", "back"]),
                ("Bicep Curls", "3", "10-12", "Light", 60, ["biceps"]),
            ],
        },
        "legs": {
            "focus": "Quads • Hamstrings • Glutes",
            "estimatedMinutes": 50,
            "exercises": [
                ("Bodyweight Squats", "3", "10-15", "Bodyweight", 60, ["quads", "glutes"]),
                ("Goblet Squat", "3", "8-12", "Light", 90, ["quads", "glutes"]),
                ("Romanian Deadlift", "3", "8-10", "Light", 90, ["hamstrings", "glutes"]),
                ("Walking Lunges", "2", "10 each leg", "Bodyweight/Light", 75, ["quads", "glutes"]),
                ("Calf Raises", "3", "12-15", "Bodyweight", 45, ["calves"]),
            ],
        },
        "core": {
            "focus": "Core Stability",
            "estimatedMinutes": 30,
            "exercises": [
                ("Plank", "3", "30-45 sec", "Bodyweight", 45, ["core"]),
                ("Dead Bug", "3", "10 each side", "Bodyweight", 45, ["core"]),
                ("Bird Dog", "3", "10 each side", "Bodyweight", 45, ["core"]),
                ("Russian Twists", "3", "12-16", "Light", 45, ["core"]),
            ],
        },
        "full-body": {
            "focus": "Full Body",
            "estimatedMinutes": 50,
            "exercises": [
                ("Squat to Chair", "3", "10-12", "Bodyweight", 60, ["quads", "glutes"]),
                ("Incline Push-ups", "3", "8-12", "Bodyweight", 60, ["chest", "triceps"]),
                ("Dumbbell Row", "3", "8-10", "Light", 75, ["back"]),
                ("Hip Hinge (Good Morning)", "3", "10-12", "Bodyweight", 60, ["hamstrings", "glutes"]),
                ("Farmer Carry", "3", "30-45 sec", "Light", 60, ["core", "grip"]),
            ],
        },
        "strength": {
            "focus": "Strength (Beginner)",
            "estimatedMinutes": 45,
            "exercises": [
                ("Squat (light)", "3", "5-8", "Moderate", 120, ["quads", "glutes"]),
                ("Bench Press (light)", "3", "5-8", "Moderate", 120, ["chest", "triceps"]),
                ("Row (light)", "3", "6-10", "Moderate", 120, ["back"]),
                ("Plank", "3", "30-45 sec", "Bodyweight", 60, ["core"]),
            ],
        },
        "cardio": {
            "focus": "Cardio",
            "estimatedMinutes": 30,
            "exercises": [
                ("Brisk Walk", "1", "20-30 min", "Easy", 0, ["cardio"]),
                ("Jump Rope (optional)", "3", "30 sec", "Easy", 45, ["cardio"]),
                ("High Knees", "3", "30 sec", "Easy", 45, ["cardio"]),
                ("Cool Down Stretch", "1", "5-8 min", "Easy", 0, ["mobility"]),
            ],
        },
        "mobility": {
            "focus": "Mobility & Recovery",
            "estimatedMinutes": 25,
            "exercises": [
                ("Neck/Shoulder Mobility", "2", "45 sec", "Easy", 20, ["mobility", "shoulders"]),
                ("Hip Opener Stretch", "2", "45 sec", "Easy", 20, ["mobility", "hips"]),
                ("Hamstring Stretch", "2", "45 sec", "Easy", 20, ["mobility", "hamstrings"]),
                ("Thoracic Rotation", "2", "8 each side", "Easy", 20, ["mobility", "back"]),
            ],
        },
    }

    if workout_type not in templates:
        workout_type = "full-body"

    t = templates[workout_type]
    exercises = []
    for name, sets, reps, weight, rest, groups in t["exercises"]:
        ex_id = f"{day_key}-{_slug(name)}"
        exercises.append(_exercise(ex_id, name, sets, reps, weight, rest, groups))

    return {
        "title": title,
        "day": day_key,
        "focus": t["focus"],
        "estimatedMinutes": t["estimatedMinutes"],
        "tip": tip,
        "isRestDay": False,
        "exercises": exercises,
    }


@planner_bp.get("/day")
@jwt_required()
def get_day_plan():
    user_id = int(get_jwt_identity())
    day = (request.args.get("day") or "monday").lower().strip()
    if day not in DAY_KEYS:
        return jsonify({"message": "Invalid day."}), 400

    profile = _get_profile(user_id)
    weekly_split = _load_weekly_split(profile)
    workout_type = weekly_split.get(day, "full-body")

    plan = _plan_for_type(day, workout_type)
    # Send back profile too so the UI can keep weekend mode buttons in sync.
    return jsonify({"plan": plan, "profile": {"weeklySplit": weekly_split}})


@planner_bp.get("/progress")
@jwt_required()
def get_day_progress():
    user_id = int(get_jwt_identity())
    day = (request.args.get("day") or "monday").lower().strip()
    if day not in DAY_KEYS:
        return jsonify({"message": "Invalid day."}), 400

    rows = PlannerExerciseProgress.query.filter_by(user_id=user_id, day=day, completed=True).all()
    return jsonify({"completed": [r.exercise_id for r in rows]})


@planner_bp.post("/progress")
@jwt_required()
def set_exercise_progress():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    day = (data.get("day") or "").lower().strip()
    exercise_id = (data.get("exerciseId") or "").strip()
    completed = bool(data.get("completed"))

    if day not in DAY_KEYS:
        return jsonify({"message": "Invalid day."}), 400
    if not exercise_id:
        return jsonify({"message": "exerciseId is required."}), 400

    row = PlannerExerciseProgress.query.filter_by(user_id=user_id, day=day, exercise_id=exercise_id).first()
    if not row:
        row = PlannerExerciseProgress(user_id=user_id, day=day, exercise_id=exercise_id, completed=completed)
        db.session.add(row)
    else:
        row.completed = completed
        row.updated_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"ok": True, "exerciseId": exercise_id, "completed": completed})


@planner_bp.post("/profile")
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    weekly_split_patch = data.get("weeklySplit") or {}
    if not isinstance(weekly_split_patch, dict):
        return jsonify({"message": "weeklySplit must be an object."}), 400

    # Only allow known values for weekends; weekdays accept the planner's supported keys too.
    allowed_types = {
        "push",
        "pull",
        "legs",
        "strength",
        "core",
        "cardio",
        "mobility",
        "full-body",
        "rest",
    }

    profile = _get_profile(user_id)
    weekly_split = _load_weekly_split(profile)

    for k, v in weekly_split_patch.items():
        day = str(k).lower().strip()
        wt = str(v).lower().strip()
        if day not in DAY_KEYS:
            continue
        if wt not in allowed_types:
            continue
        if day in ("saturday", "sunday") and wt not in WEEKEND_MODES:
            continue
        weekly_split[day] = wt

    profile.weekly_split_json = json.dumps(weekly_split, ensure_ascii=False)
    profile.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"ok": True, "profile": {"weeklySplit": weekly_split}})

