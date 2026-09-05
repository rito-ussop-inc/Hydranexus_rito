# HydraNexus Frontend

Minimalist operator dashboard built with React + Vite + Tailwind CSS + shadcn/ui
patterns (`src/components/ui`: button, card, badge, input, separator, table),
Lucide icons, React Flow network map and Recharts telemetry.

Pages: Overview · Network · Telemetry · Investigation · Impact · What-If ·
History · Settings. Demo mode — simulated data, no live sensors connected.

## Run

```bash
npm install
copy .env.example .env   # set VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

Backend client (`src/api.js`) uses the FastAPI backend when reachable and
falls back to mock `src/data.js` otherwise.

## Production build

```bash
npm run build
```
