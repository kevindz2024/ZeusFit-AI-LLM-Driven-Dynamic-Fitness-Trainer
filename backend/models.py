from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    age = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)  # kg
    height = db.Column(db.Float, nullable=True)  # cm
    goal = db.Column(db.String(80), nullable=True)  # e.g. "fat loss"
    preference = db.Column(db.String(80), nullable=True)  # e.g. "home"

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_safe_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "age": self.age,
            "weight": self.weight,
            "height": self.height,
            "goal": self.goal,
            "preference": self.preference,
            "created_at": self.created_at.isoformat(),
        }


class WorkoutPlan(db.Model):
    __tablename__ = "workout_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    prompt = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=False)  # Gemini response text (JSON-like string)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class WorkoutProfile(db.Model):
    """
    Lightweight profile settings used by the workout planner UI.
    Stored in a separate table to avoid needing migrations for the existing User model.
    """

    __tablename__ = "workout_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    weekly_split_json = db.Column(db.Text, nullable=False, default="{}")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class PlannerExerciseProgress(db.Model):
    __tablename__ = "planner_exercise_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    day = db.Column(db.String(20), nullable=False, index=True)  # "monday"..."sunday"
    exercise_id = db.Column(db.String(80), nullable=False)  # stable id from the generated plan
    completed = db.Column(db.Boolean, nullable=False, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "day", "exercise_id", name="uq_user_day_exercise"),)


class DietPlan(db.Model):
    __tablename__ = "diet_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    prompt = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ProgressLog(db.Model):
    __tablename__ = "progress_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    weight = db.Column(db.Float, nullable=False)  # kg
    bmi = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ChatHistory(db.Model):
    __tablename__ = "chat_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)  # "user" | "assistant"
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
