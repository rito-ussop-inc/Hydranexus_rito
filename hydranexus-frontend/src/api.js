// HydraNexus backend client (software-first, offline-capable).
// Tries FastAPI at VITE_API_URL, falls back to mock src/data.js when unreachable.
// Keeps human-in-the-loop: all AI results are advisory with confidence + evidence.

// Resolve backend base URL. Priority:
// 1. VITE_API_URL (explicit, e.g. http://127.0.0.1:8000)
// 2. Same hostname as the page on port 8000 (avoids Windows localhost→::1
//    IPv6 mismatch when the backend is bound to 127.0.0.1)
// 3. http://localhost:8000 fallback
function resolveBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  try {
    const host = window?.location?.hostname
    if (host) return `http://${host}:8000`
  } catch { /* non-browser (SSR/tests) -> fallback below */ }
  return 'http://localhost:8000'
}

const BASE = resolveBase()

async function fetchJson(path, options = {}, timeoutMs = 4000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export const apiBase = BASE

export async function checkHealth() {
  // Retry once: the backend's first request can be slow (model warmup).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const j = await fetchJson('/api/health', {}, 8000)
      return { online: true, info: j }
    } catch {
      if (attempt === 1) return { online: false, info: null }
    }
  }
  return { online: false, info: null }
}

export async function fetchTelemetry(scenario = 'normal', points = 8) {
  const j = await fetchJson(`/api/telemetry?scenario=${encodeURIComponent(scenario)}&points=${points}`)
  return j.telemetry
}

export async function fetchGraph(incidentActive = false) {
  const j = await fetchJson(`/api/network/graph?incidentActive=${incidentActive}`)
  return j
}

export async function postDetect(telemetry) {
  const j = await fetchJson('/api/ai/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telemetry }),
  })
  return j
}

export async function fetchAlerts(scenario = 'leak', points = 8) {
  const j = await fetchJson(`/api/ai/alerts?scenario=${encodeURIComponent(scenario)}&points=${points}`)
  return j
}

export async function postVerify(observed, hypothesis = 'leak', segment = 'B2 → B3') {
  const j = await fetchJson('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observed, hypothesis, segment }),
  })
  return j
}

export async function postWhatIf(scenario = 'isolate', valveThrottle = 50) {
  const j = await fetchJson('/api/whatif', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, valveThrottle }),
  })
  return j
}
