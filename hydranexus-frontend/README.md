# HydraNexus Frontend MVP

Glassmorphism, light-sky-blue operator dashboard for the HydraNexus water infrastructure decision-intelligence hackathon prototype.

## Includes
- Command Center
- Network Map
- Telemetry
- Investigation
- Impact Assessment
- What-If Studio
- Incident History
- Settings
- Mock leak/burst/demand/sensor scenarios
- React Flow network visualization
- Recharts telemetry charts
- Backend-ready page structure

## Run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The current data is intentionally simulated. Replace API/mock state in `src/data.js` and the relevant page actions when connecting FastAPI + ML + NetworkX later.
