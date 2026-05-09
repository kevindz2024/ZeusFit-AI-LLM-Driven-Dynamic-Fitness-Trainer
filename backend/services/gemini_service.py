import json
import os

from google import genai


def _client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY in backend/.env")
    return genai.Client(api_key=api_key)


def generate_text(contents: str, model: str = "gemini-2.5-flash") -> str:
    """
    Simple wrapper around Gemini text generation.
    Returns plain text (we ask the model to output JSON when needed).
    """
    client = _client()
    resp = client.models.generate_content(model=model, contents=contents)
    return (resp.text or "").strip()


def safe_json(text: str):
    """
    Best-effort JSON parse (Gemini might wrap JSON in markdown fences).
    Returns dict/list if parse succeeds, else None.
    """
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        lines = cleaned.splitlines()
        if lines and lines[0].lower().startswith("json"):
            lines = lines[1:]
        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)
    except Exception:
        return None
