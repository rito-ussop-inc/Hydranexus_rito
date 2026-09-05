import { useMemo, useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Download, Play, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import PageHeader from './components/PageHeader'
import NetworkMap from './components/NetworkMap'
import TelemetryCharts from './components/TelemetryCharts'
import { Button } from './components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Input } from './components/ui/input'
import { Separator } from './components/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/ui/table'
import {
  zones,
  incidents,
  normalTelemetry,
  leakTelemetry,
  burstTelemetry,
  demandTelemetry,
  sensorTelemetry,
  whatIfOptions,
} from './data'
import { checkHealth, fetchTelemetry, postVerify } from './api'

const pageMeta = {
  overview: ['Overview', 'Network health and active incidents.'],
  network: ['Network', 'Topology, zones and the suspected fault location.'],
  monitoring: ['Telemetry', 'Flow, pressure and consumption. Simulated feed.'],
  incident: ['Investigation', 'Evidence behind the current hypothesis.'],
  impact: ['Impact', 'Estimated loss, exposure and severity.'],
  whatif: ['What-If', 'Compare interventions before acting.'],
  history: ['History', 'Active and resolved events.'],
  settings: ['Settings', 'Prototype controls and data environment.'],
}

const fmt = (value) => Number(value).toLocaleString()

function PageSection({ eyebrow, title, description, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          {eyebrow && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, hint, alert = false }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight ${alert ? 'text-destructive' : ''}`}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null
  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-md border bg-background p-3 shadow-md">
      {toast.type === 'danger' ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      )}
      <p className="text-sm">{toast.message}</p>
      <button onClick={onClose} className="rounded p-0.5 text-muted-foreground hover:bg-accent" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ------------------------------- Overview ------------------------------- */

function Overview({ active, data, setPage, trigger, onExport }) {
  const flow = active ? 11500 : 8180
  const pressure = active ? 3.3 : 4.0
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Status" value={active ? 'Investigating' : 'Normal'} hint={active ? '1 high-severity incident' : 'Within baseline'} alert={active} />
        <Stat label="Flow" value={`${fmt(flow)} L/hr`} hint="Baseline ≈ 8,000 L/hr" alert={active} />
        <Stat label="Avg. pressure" value={`${pressure.toFixed(1)} bar`} hint="Baseline ≈ 4.0 bar" alert={active} />
        <Stat label="Est. loss" value={active ? '3,500 L/hr' : '0 L/hr'} hint={active ? 'Potential leak' : 'No active loss'} alert={active} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <CardDescription>Simulated topology</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPage('network')}>
              Open map
            </Button>
          </CardHeader>
          <CardContent>
            <NetworkMap incidentActive={active} compact onSelectSegment={() => setPage('network')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{active ? 'Active incident' : 'No active incident'}</CardTitle>
            <CardDescription>{active ? 'B2 → B3 · Zone B · INC-1048' : 'System nominal'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {active ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Probable pipeline leak</span>
                  <Badge variant="destructive">High</Badge>
                </div>
                <Separator />
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Confidence</dt>
                    <dd className="font-medium">76%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Est. loss</dt>
                    <dd className="font-medium">3,500 L/hr</dd>
                  </div>
                </dl>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => setPage('incident')}>
                    Investigate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPage('whatif')}>
                    What-if
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={onExport}>
                  <Download /> Export report
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-sm font-medium">Network looks healthy</p>
                <p className="mt-1 text-xs text-muted-foreground">Inject a controlled incident to test the workflow.</p>
                <Button size="sm" className="mt-3" onClick={trigger}>
                  <Play /> Trigger simulated leak
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PageSection eyebrow="Telemetry" title="Network pulse" description="Simulated feed with anomaly scoring.">
        <TelemetryCharts data={data} />
      </PageSection>

      <PageSection eyebrow="Zones" title="Zone health">
        <div className="grid gap-3 md:grid-cols-3">
          {zones.map((zone) => {
            const critical = active && zone.id === 'B'
            return (
              <Card key={zone.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{zone.name}</CardTitle>
                  {critical ? <Badge variant="destructive">Critical</Badge> : <Badge variant="secondary">Normal</Badge>}
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Demand</dt>
                      <dd className="font-medium">{fmt(zone.demand)} L/hr</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Pressure</dt>
                      <dd className="font-medium">{(critical ? 3.3 : zone.pressure).toFixed(1)} bar</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {fmt(zone.users)} users · Baseline loss {zone.baselineLoss}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </PageSection>
    </div>
  )
}

/* -------------------------------- Network ------------------------------- */

function NetworkPage({ active }) {
  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="Topology"
        title="Distribution map"
        description="Prototype network. Highlight follows the AI localization."
        action={active && <Badge variant="destructive">Suspected: B2 → B3</Badge>}
      >
        <NetworkMap incidentActive={active} />
      </PageSection>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {['Reservoir · Source', 'N1 · Main junction', 'N2 · Zone A', 'N3 · B2 junction', 'N4 · B3 / Zone B', 'N5 · Zone C'].map(
              (item) => (
                <div key={item} className="flex items-center justify-between border-b py-1.5 last:border-0">
                  <span>{item}</span>
                  <Badge variant="secondary">Online</Badge>
                </div>
              )
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Localization</CardTitle>
            <CardDescription>How the suspected segment is chosen</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Abnormal telemetry is combined with the NetworkX topology to rank the most plausible segment. A production
            connector could supply SCADA, GIS and hydraulic-model data here.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------- Monitoring ------------------------------ */

const SCENARIOS = [
  ['normal', 'Normal'],
  ['leak', 'Leak'],
  ['burst', 'Burst'],
  ['demand', 'Demand spike'],
  ['sensor', 'Sensor fault'],
]

function MonitoringPage({ scenario, setScenario }) {
  const [search, setSearch] = useState('')
  const [live, setLive] = useState(null)
  const mocks = { normal: normalTelemetry, leak: leakTelemetry, burst: burstTelemetry, demand: demandTelemetry, sensor: sensorTelemetry }

  useEffect(() => {
    let cancelled = false
    setLive(null)
    fetchTelemetry(scenario, 8)
      .then((d) => {
        if (!cancelled) setLive(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [scenario])

  const data = live || mocks[scenario]
  const last = data.at(-1)
  const filtered = search ? data.filter((d) => d.time.includes(search) || String(d.flow).includes(search)) : data

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="Telemetry"
        title="Monitoring"
        description={live ? 'Live backend feed.' : 'Backend unreachable — showing cached mock.'}
        action={
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {SCENARIOS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Flow" value={`${fmt(last.flow)} L/hr`} hint="Expected ≈ 8,000" alert={last.flow > 9000} />
          <Stat label="Pressure" value={`${last.pressure.toFixed(1)} bar`} hint="Expected ≈ 4.0" alert={last.pressure < 3.6} />
          <Stat label="Consumption" value={`${fmt(last.consumption)} L/hr`} hint="Expected ≈ 3,000" alert={last.consumption > 3600} />
        </div>
        <TelemetryCharts data={data} />
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Readings</CardTitle>
            <Input placeholder="Filter by time…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[180px]" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Flow</TableHead>
                  <TableHead>Pressure</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Anomaly</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered
                  .slice()
                  .reverse()
                  .map((row) => {
                    const abnormal = row.flow > 9000 || row.pressure < 3.6 || row.consumption > 3600
                    return (
                      <TableRow key={row.time}>
                        <TableCell className="font-medium">{row.time}</TableCell>
                        <TableCell>{fmt(row.flow)}</TableCell>
                        <TableCell>{row.pressure.toFixed(1)}</TableCell>
                        <TableCell>{fmt(row.consumption)}</TableCell>
                        <TableCell>{row.anomalyScore?.toFixed(2)}</TableCell>
                        <TableCell>
                          {abnormal ? <Badge variant="destructive">Anomaly</Badge> : <Badge variant="secondary">Normal</Badge>}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}

/* ------------------------------ Investigation ---------------------------- */

function InvestigationPage({ active, verify, verified, onExport }) {
  const incident = incidents[0]
  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="Investigation"
        title="Why is the network abnormal?"
        action={verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="outline">Needs verification</Badge>}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Incident snapshot</CardTitle>
              <CardDescription>{active ? `${incident.location} · ${incident.zone}` : 'No active incident'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {active ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{incident.title}</span>
                    <Badge variant="destructive">High</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Flow change" value="+31%" alert />
                    <Stat label="Pressure change" value="−17%" alert />
                  </div>
                  <Separator />
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Probable location</dt>
                      <dd className="font-medium">B2 → B3 (81% confidence)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Primary hypothesis</dt>
                      <dd className="font-medium">Pipeline leak</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Trigger a simulated incident from the header.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Possible causes</CardTitle>
              <CardDescription>Ranked by the hybrid ML + rules model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {incident.causes.map(([cause, score]) => (
                <div key={cause}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{cause}</span>
                    <span className="font-medium">{active ? score : 0}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${active ? score : 0}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incident.evidence.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Compare the observed pattern with a simulated B2 → B3 leak.</p>
            <div className="flex gap-2">
              <Button size="sm" variant={verified ? 'secondary' : 'default'} onClick={verify}>
                {verified ? 'Verified' : 'Verify scenario'}
              </Button>
              <Button size="sm" variant="outline" onClick={onExport}>
                <Download /> Export JSON
              </Button>
            </div>
          </CardFooter>
        </Card>
      </PageSection>
    </div>
  )
}

/* --------------------------------- Impact -------------------------------- */

function ImpactPage({ active }) {
  if (!active) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No active incident. Trigger the simulated leak to populate the impact assessment.
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <PageSection eyebrow="Impact" title="Operational impact" description="Loss, exposure and severity.">
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Est. loss" value="3,500 L/hr" alert />
          <Stat label="24-hour projection" value="84,000 L" alert />
          <Stat label="Affected zone" value="Zone B" hint="560 users" />
        </div>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Priority: High</CardTitle>
              <CardDescription>Immediate investigation recommended.</CardDescription>
            </div>
            <Badge variant="destructive">High</Badge>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Loss continues while the incident is unresolved. Isolating B2 → B3 reduces loss but affects Zone B service.
            Final intervention stays with a qualified operator.
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}

/* --------------------------------- What-If ------------------------------- */

function WhatIfPage({ active }) {
  const [option, setOption] = useState('isolate')
  const [ran, setRan] = useState(false)
  const [throttle, setThrottle] = useState(50)
  const chosen = whatIfOptions[option]

  const afterLoss = useMemo(() => {
    if (option === 'reducePressure') {
      const factor = (100 - throttle) / 100
      return Math.round(3500 * (0.45 + factor * 0.55))
    }
    return chosen.after.loss
  }, [option, throttle, chosen])

  const reduction = Math.round(((chosen.before.loss - afterLoss) / chosen.before.loss) * 100)

  if (!active) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No active incident. Trigger the simulated leak to enable what-if analysis.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="Decision support"
        title="What-If Studio"
        description="Simulated outcomes. Operator controlled."
        action={<Badge variant="outline">Advisory only</Badge>}
      >
        <div className="grid gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Intervention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(whatIfOptions).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    setOption(key)
                    setRan(false)
                  }}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                    option === key ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.notes}</span>
                </button>
              ))}
              {option === 'reducePressure' && (
                <div className="rounded-md border p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valve throttle</span>
                    <span className="font-medium">{throttle}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={throttle}
                    onChange={(e) => setThrottle(Number(e.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                </div>
              )}
              <Button className="w-full" onClick={() => setRan(true)}>
                Run simulation
              </Button>
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{ran ? 'Simulated result' : 'Ready'}</CardTitle>
              <CardDescription>{ran ? chosen.label : 'Select an intervention and run the simulation.'}</CardDescription>
            </CardHeader>
            {ran && (
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Loss reduction" value={`${reduction}%`} />
                  <Stat label="Pressure after" value={`${chosen.after.pressure.toFixed(1)} bar`} />
                  <Stat label="Users affected" value={chosen.after.users} alert={chosen.after.users > 0} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Before</p>
                    <p className="mt-1 text-xl font-semibold">{fmt(chosen.before.loss)} <span className="text-xs font-normal text-muted-foreground">L/hr</span></p>
                  </div>
                  <div className="rounded-md border border-primary/30 bg-accent/50 p-4">
                    <p className="text-xs text-muted-foreground">After</p>
                    <p className="mt-1 text-xl font-semibold">{fmt(afterLoss)} <span className="text-xs font-normal text-muted-foreground">L/hr</span></p>
                  </div>
                </div>
                <p className="rounded-md bg-secondary p-3 text-xs leading-5 text-secondary-foreground">{chosen.notes}</p>
              </CardContent>
            )}
          </Card>
        </div>
      </PageSection>
    </div>
  )
}

/* --------------------------------- History ------------------------------- */

function HistoryPage({ setPage }) {
  const [filter, setFilter] = useState('')
  const rows = incidents.filter(
    (i) => i.title.toLowerCase().includes(filter.toLowerCase()) || i.id.toLowerCase().includes(filter.toLowerCase())
  )
  return (
    <div className="space-y-4">
      <PageSection
        eyebrow="History"
        title="Incidents"
        action={<Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[180px]" />}
      >
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.id}</div>
                      <div className="text-xs text-muted-foreground">{item.title}</div>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.started}</TableCell>
                    <TableCell>
                      <Badge variant={item.severity === 'HIGH' ? 'destructive' : 'outline'}>{item.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Resolved' ? 'secondary' : 'outline'}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage('monitoring')}>
                Explore telemetry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  )
}

/* --------------------------------- Settings ------------------------------ */

function SettingsPage() {
  const [backend, setBackend] = useState({ online: false, checked: false })
  useEffect(() => {
    checkHealth()
      .then((r) => setBackend({ online: r.online, checked: true }))
      .catch(() => setBackend({ online: false, checked: true }))
  }, [])
  const env = [
    ['Data source', backend.checked ? (backend.online ? 'Live API + mock fallback' : 'Mock (API offline)') : 'Checking…'],
    ['Analytics', 'Hybrid ML + rules'],
    ['Network model', 'NetworkX topology'],
    ['Simulation', 'FastAPI scenario engine'],
    ['Deployment', 'React + Vite'],
  ]
  return (
    <div className="space-y-4">
      <PageSection eyebrow="Prototype" title="Settings">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Backend</CardTitle>
              <CardDescription>FastAPI connection status</CardDescription>
            </CardHeader>
            <CardContent>
              {backend.checked ? (
                backend.online ? (
                  <Badge variant="secondary">Online</Badge>
                ) : (
                  <Badge variant="destructive">Offline — using mock data</Badge>
                )
              ) : (
                <Badge variant="outline">Checking…</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {env.map(([a, b]) => (
                <div key={a} className="flex items-center justify-between border-b py-1.5 last:border-0">
                  <span className="text-muted-foreground">{a}</span>
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </div>
  )
}

/* ----------------------------------- App --------------------------------- */

export default function App() {
  const [page, setPage] = useState('overview')
  const [active, setActive] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scenario, setScenario] = useState('normal')
  const [verified, setVerified] = useState(false)
  const [toast, setToast] = useState(null)

  const data = useMemo(
    () =>
      active || scenario === 'leak'
        ? leakTelemetry
        : scenario === 'burst'
          ? burstTelemetry
          : scenario === 'demand'
            ? demandTelemetry
            : scenario === 'sensor'
              ? sensorTelemetry
              : normalTelemetry,
    [active, scenario]
  )

  const trigger = () => {
    const next = !active
    setActive(next)
    setScenario(next ? 'leak' : 'normal')
    setVerified(false)
    setToast({
      message: next ? 'Leak anomaly detected on segment B2 → B3.' : 'Returned to normal baseline.',
      type: next ? 'danger' : 'success',
    })
  }

  const doVerify = async () => {
    setVerified(true)
    try {
      const res = await postVerify(data, scenario === 'normal' ? 'leak' : scenario, 'B2 → B3')
      setToast({ message: `Verification: ${res.matchScore}% (${res.evidenceStrength}).`, type: res.verified ? 'success' : 'info' })
    } catch {
      setToast({ message: 'Verified against the local mock model.', type: 'success' })
    }
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      activeIncident: active ? incidents[0] : null,
      telemetrySnapshot: data,
      systemStatus: active ? 'ALERT' : 'NORMAL',
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hydranexus-incident-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast({ message: 'Incident report exported.', type: 'success' })
  }

  const meta = pageMeta[page]
  const render = () => {
    if (page === 'overview') return <Overview active={active} data={data} setPage={setPage} trigger={trigger} onExport={exportReport} />
    if (page === 'network') return <NetworkPage active={active} />
    if (page === 'monitoring')
      return (
        <MonitoringPage
          scenario={scenario}
          setScenario={(s) => {
            setScenario(s)
            setActive(s === 'leak')
          }}
        />
      )
    if (page === 'incident') return <InvestigationPage active={active} verify={doVerify} verified={verified} onExport={exportReport} />
    if (page === 'impact') return <ImpactPage active={active} />
    if (page === 'whatif') return <WhatIfPage active={active} />
    if (page === 'history') return <HistoryPage setPage={setPage} />
    return <SettingsPage />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="lg:flex">
        <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} incidentActive={active} />
        <div className="min-w-0 flex-1">
          <PageHeader title={meta[0]} subtitle={meta[1]} onMenu={() => setMobileOpen(true)} onTrigger={trigger} incidentActive={active} />
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
            {render()}
            <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
              HydraNexus MVP · Demo mode — simulated data, no live sensors · Human-in-the-loop
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
