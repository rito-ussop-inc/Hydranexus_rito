// HydraNexus backend client (software-first, offline-capable).
// Tries FastAPI at VITE_API_URL, falls back to mock src/data.js when unreachable.
// Keeps human-in-the-loop: all AI results are advisory with confidence + evidence.

const BASE = (import.meta?.env?.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

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
  try {
    const j = await fetchJson('/api/health', {}, 2500)
    return { online: true, info: j }
  } catch {
    return { online: false, info: null }
  }
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
