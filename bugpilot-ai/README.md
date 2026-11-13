# BugPilot AI

AI-powered QA, developer, and employer collaboration platform.

## What works now
- Landing page, role selection, separate QA and Developer login/registration
- FastAPI backend with JWT auth, bcrypt password hashing, SQLite persistence
- Role-based authorization enforced by the backend (QA and developer routes are separate)
- Employer workspace with direct chat to any registered QA engineer or developer
- Shared team chat for employers and staff, with recent messages refreshed while the page is open
- AI service using your local Qwen model through Ollama, with bounded retries and timeouts
- Dashboards (placeholders) that show real system checks: API health, role access, AI provider status

## Not built yet (later phases)
Bug report downloads, duplicate detection, and WebSocket-based live updates are planned.

## Requirements
- Node.js 18+
- Python 3.10+

## Run everything with ONE command
```bash
npm start
```
Then open **http://localhost:5173**.

The first run creates a Python virtual environment, installs backend and frontend dependencies, and creates `.env` with a random JWT secret. Later runs start in seconds. Press `Ctrl+C` to stop both servers.

- Frontend: http://localhost:5173 (Vite)
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:5173/api/health

The frontend proxies `/api` to the backend, so there is no CORS setup to do locally.

## Local AI with Ollama
Start Ollama and make sure the configured model is installed (`ollama pull qwen2.5:0.5b`). Set these values in `.env` and restart:
```
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:0.5b
```
No cloud API keys are needed. The backend talks to Ollama on the configured local endpoint; React never calls Ollama directly. If it is unavailable, the API shows a connection error.

## Let Vincy inspect a project
1. Sign in as QA and open **Upload Project**.
2. Upload a project ZIP or choose one of the React/Python example ZIPs.
3. Open **Chat with Vincy**, select the uploaded project, and describe the issue you see.
4. Vincy reads a bounded set of source files from the ZIP and drafts a bug report in the chat, including severity, reproduction steps, expected/actual behavior, and code evidence where available.

ZIPs are size limited and source files are read without extracting the archive. Secret files and generated/vendor directories are excluded from the context sent to the local model.

## Accounts
There are no built-in credentials. Open a role page, choose **Create an account**, and register as QA, Developer, or Employer. Employers can select and message any registered QA engineer or developer in Team chat; staff can reply from their Team chat.

## Tests
```bash
cd backend
.venv/bin/pip install -r requirements-dev.txt     # Windows: .venv\Scripts\pip
.venv/bin/python -m pytest
```

## Structure
```
start.mjs            one-command launcher
backend/app/         main.py, config.py, database.py, models.py, schemas.py, security.py, deps.py
  routers/           health, auth, roles, ai
  services/ai/       base, openai_compat, ollama, manager
  services/          project_inspector.py reads bounded source excerpts from ZIPs
backend/tests/
frontend/src/        pages/, components/, api/, context/
```

## Known limitations of Phase 1
- Anyone can register as either role. Before real use, restrict registration (invite codes or admin-created developer accounts).
- No login rate limiting yet.
- The JWT is kept in localStorage, which is simple but exposed if the site ever has an XSS bug.
