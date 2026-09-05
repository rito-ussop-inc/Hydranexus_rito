# HydraNexus Backend (MVP)

FastAPI + Pandas/NumPy + Scikit-learn + NetworkX decision-intelligence API.
Software-first: all telemetry is simulated; no physical sensors required.
Human-in-the-loop: every response carries confidence, evidence, and operator notes. No autonomous control.

## Pipeline
`Detect → Investigate → Verify → Assess → Simulate → Decide`

## Run (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open: http://localhost:8000/docs (Swagger)

## Endpoints
- `GET /api/health`
- `GET /api/network/graph?incidentActive=true`
- `GET /api/telemetry?scenario=leak&points=8`
- `POST /api/ai/detect` `{ telemetry: [...] }`
- `GET /api/ai/alerts?scenario=leak`
- `GET /api/impact?scenario=leak`
- `POST /api/verify` `{ observed, hypothesis, segment }`
- `POST /api/whatif` `{ scenario, valveThrottle }`
- `GET /api/whatif/options`
- `GET /api/incidents`

## Demo data generation (Phase 1)

```powershell
python generate_demo.py --scenario leak --points 24 --out demo_leak.csv
```

## Frontend wiring
Set `VITE_API_URL=http://localhost:8000` in `hydranexus-frontend/.env`.
`src/api.js` auto-falls back to mock `src/data.js` when the API is unreachable,
so the dashboard demos offline.
