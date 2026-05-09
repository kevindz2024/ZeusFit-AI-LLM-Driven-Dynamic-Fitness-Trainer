# ZeusFit AI: LLM-Driven Dynamic Fitness Trainer

Simple **college mini project** that runs on a normal laptop (8GB RAM, no GPU) using:

- Frontend: React + Vite, Tailwind CSS, Axios, React Router, Recharts
- Backend: Flask, Flask-CORS, Flask-SQLAlchemy, Flask-JWT-Extended
- DB: SQLite
- AI: Google Gemini (via `google-genai`)

## Folder structure

```
backend/
  app.py
  models.py
  routes/
    __init__.py
    auth.py
    workout.py
    diet.py
    chatbot.py
    progress.py
  services/
    __init__.py
    gemini_service.py
  requirements.txt
  .env
  .env.example

frontend/
  src/
    api/
      client.js
    components/
      Button.jsx
      Card.jsx
      Input.jsx
      Navbar.jsx
      ProtectedRoute.jsx
    context/
      AuthContext.jsx
    pages/
      Landing.jsx
      Login.jsx
      Register.jsx
      Dashboard.jsx
      Workout.jsx
      Diet.jsx
      Chatbot.jsx
    App.jsx
    main.jsx
    index.css
```

## Run the backend (Flask)

Open PowerShell in the project folder.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

### Gemini API key

Edit `backend/.env` and set:

```
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
```

## Run the frontend (React + Vite)

Open a second PowerShell.

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at the URL printed by Vite (usually `http://127.0.0.1:5173`).

## Main APIs (backend)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/workout/generate`
- `GET /api/workout/latest`
- `POST /api/diet/generate`
- `GET /api/diet/latest`
- `POST /api/chatbot/message`
- `GET /api/chatbot/history`
- `POST /api/progress`
- `GET /api/progress`

