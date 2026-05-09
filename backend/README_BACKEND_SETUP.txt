Backend quick setup (Windows PowerShell)

1) Create venv
   python -m venv .venv

2) Activate venv
   .\.venv\Scripts\Activate.ps1

3) Install deps
   pip install -r requirements.txt

4) Set Gemini key in .env (already created)
   GEMINI_API_KEY=...

5) Run
   python app.py

API health check: http://127.0.0.1:5000/api/health

