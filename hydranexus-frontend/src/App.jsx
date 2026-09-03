import { useMemo, useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import PageHeader from './components/PageHeader'
import Badge from './components/Badge'
import Panel from './components/Panel'
import StatCard from './components/StatCard'
import SectionTitle from './components/SectionTitle'
import NetworkMap from './components/NetworkMap'
import TelemetryCharts from './components/TelemetryCharts'
import { zones, incidents, normalTelemetry, leakTelemetry, burstTelemetry, demandTelemetry, sensorTelemetry, whatIfOptions, systemMetrics } from './data'

const pageMeta = {
  overview: ['Command Center', 'A calm, operator-first view of network health and incidents.'],
  network: ['Network Map', 'Understand topology, zones and the probable fault location.'],
  monitoring: ['Telemetry', 'Explore flow, pressure and consumption behavior.'],
  incident: ['Investigation', 'Turn the active alert into an evidence-backed hypothesis.'],
  impact: ['Impact Assessment', 'Estimate water loss, exposure and operational severity.'],
  whatif: ['What-If Studio', 'Compare possible interventions before acting.'],
  history: ['Incident History', 'Review resolved and active events across the network.'],
  settings: ['Settings', 'Prototype controls and data environment.'],
}

const fmt = (value) => Number(value).toLocaleString()

function AppButton({ children, onClick, variant = 'primary', className = '', type = 'button' }) {
  const styles = {
    primary: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_12px_32px_rgba(14,165,233,.28)] hover:from-sky-400 hover:to-cyan-400 active:scale-[0.98]',
    soft: 'bg-white/80 text-slate-700 border border-white/90 shadow-sm hover:bg-white active:scale-[0.98]',
    dark: 'bg-slate-900 text-white shadow-md hover:bg-slate-800 active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-600 hover:bg-white/60',
    danger: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_12px_32px_rgba(244,63,94,.28)] hover:from-rose-400 hover:to-pink-400 active:scale-[0.98]',
  }
  return <button type={type} onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${styles[variant]} ${className}`}>{children}</button>
}

function Metric({ label, value, hint, tone = 'default' }) {
  const toneClass = tone === 'danger' ? 'text-rose-600' : tone === 'warning' ? 'text-amber-600' : tone === 'success' ? 'text-emerald-600' : 'text-slate-900'
  return <div className="rounded-2xl border border-white/85 bg-white/70 p-4 shadow-[0_8px_28px_rgba(56,189,248,.06)] backdrop-blur-md transition-all hover:border-white"><div className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</div><div className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</div>{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</div>
}

function Toast({ message, type = 'info', onClose }) {
  if (!message) return null
  const colors = type === 'danger' ? 'border-rose-300 bg-rose-500 text-white shadow-rose-500/20' : 'border-emerald-300 bg-emerald-600 text-white shadow-emerald-500/20'
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 ${colors}`}>
      <span>{type === 'danger' ? '⚠️' : '✅'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">✕</button>
    </div>
  )
}

function Overview({ active, data, setPage, trigger, onExport }) {
  const metric = active ? systemMetrics.network : systemMetrics.normal
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Network status" value={metric.status} helper={active ? 'Investigation in progress' : 'Within baseline'} tone={active ? 'warning' : 'normal'} icon="◉" />
      <StatCard label="Current flow" value={`${fmt(metric.flow)} L/hr`} helper="Baseline ≈ 8,000 L/hr" tone={active ? 'danger' : 'info'} icon="↗" />
      <StatCard label="Average pressure" value={`${metric.avgPressure.toFixed(1)} bar`} helper="Baseline ≈ 4.0 bar" tone={active ? 'warning' : 'info'} icon="◌" />
      <StatCard label="Estimated loss" value={`${fmt(metric.loss)} L/hr`} helper={active ? 'Potential leak loss' : 'No active loss'} tone={active ? 'danger' : 'normal'} icon="≈" />
      <StatCard label="Active anomalies" value={metric.anomalies} helper={active ? '1 high-severity incident' : 'All clear'} tone={active ? 'danger' : 'normal'} icon="!" />
    </div>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Panel eyebrow="Network overview" title="Live water network" action={<AppButton variant="soft" onClick={() => setPage('network')}>Open map</AppButton>}>
        <NetworkMap incidentActive={active} compact onSelectSegment={() => setPage('network')} />
      </Panel>
      <Panel eyebrow="Incident center" title={active ? 'Active investigation' : 'No active incident'}>
        {active ? <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-slate-900">Probable pipeline leak</div><div className="mt-1 text-xs text-slate-500">B2 → B3 · Zone B · INC-1048</div></div><Badge tone="danger">HIGH</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Confidence" value="76%" tone="danger" /><Metric label="Estimated loss" value="3,500" hint="L/hr" tone="danger" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><AppButton onClick={() => setPage('incident')}>Investigate cause</AppButton><AppButton variant="soft" onClick={() => setPage('whatif')}>Run what-if</AppButton></div>
          <AppButton variant="soft" className="w-full" onClick={onExport}>Export Incident Report</AppButton>
        </div> : <div className="flex min-h-[250px] flex-col items-center justify-center text-center"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-2xl text-emerald-600 shadow-sm">✓</div><div className="mt-4 text-lg font-bold text-slate-900">Network looks healthy</div><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Inject a controlled incident to demonstrate the full HydraNexus decision-support workflow.</p><AppButton className="mt-5" onClick={trigger}>Trigger simulated leak</AppButton></div>}
      </Panel>
    </section>

    <section><SectionTitle eyebrow="Telemetry" title="Network pulse" description="Live telemetry feed and anomaly detection visualization." /><TelemetryCharts data={data} /></section>

    <section><SectionTitle eyebrow="Pressure zones" title="Zone health" description="Quick operational view across monitored zones." /><div className="grid gap-4 md:grid-cols-3">{zones.map(zone => { const critical = active && zone.id === 'B'; return <Panel key={zone.id} title={zone.name} action={<Badge tone={critical ? 'danger' : 'success'}>{critical ? 'Critical' : 'Normal'}</Badge>}><div className="grid grid-cols-2 gap-3"><Metric label="Demand" value={`${fmt(zone.demand)} L/hr`} /><Metric label="Pressure" value={`${(critical ? 3.3 : zone.pressure).toFixed(1)} bar`} tone={critical ? 'danger' : 'default'} /></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Estimated users: {fmt(zone.users)}</span><span>Baseline loss: {zone.baselineLoss}</span></div></Panel>})}</div></section>
  </div>
}

function NetworkPage({ active }) {
  const [selected, setSelected] = useState('B2 → B3')
  return <div className="space-y-5"><SectionTitle eyebrow="Topology" title="Water distribution map" description="A simplified operator view of the prototype network." action={active && <Badge tone="danger">Suspected: B2 → B3</Badge>} /><Panel><NetworkMap incidentActive={active} onSelectSegment={setSelected} /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Nodes" value="6" /><Metric label="Pipelines" value="5" /><Metric label="Zones" value="3" /><Metric label="Selected segment" value={selected} /></div></Panel><div className="grid gap-5 lg:grid-cols-2"><Panel eyebrow="Topology" title="Network components"><div className="grid gap-2">{['Reservoir · Source','N1 · Main Junction','N2 · Zone A','N3 · B2 Junction','N4 · B3 / Zone B','N5 · Zone C'].map(item => <div key={item} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/55 px-4 py-3 text-sm"><span className="text-slate-700">{item}</span><span className="text-[10px] font-bold tracking-[.1em] text-emerald-600">ONLINE</span></div>)}</div></Panel><Panel eyebrow="How it helps" title="Probable fault localization"><p className="text-sm leading-7 text-slate-600">The prototype combines abnormal telemetry with network topology to identify the most plausible affected segment. A future production connector can supply SCADA, GIS and hydraulic-model data.</p></Panel></div></div>
}

function MonitoringPage({ scenario, setScenario }) {
  const [search, setSearch] = useState('')
  const telemetry = { normal: normalTelemetry, leak: leakTelemetry, burst: burstTelemetry, demand: demandTelemetry, sensor: sensorTelemetry }
  const data = telemetry[scenario]
  const last = data.at(-1)

  const filteredData = useMemo(() => {
    if (!search) return data
    return data.filter(d => d.time.includes(search) || String(d.flow).includes(search))
  }, [data, search])

  return <div className="space-y-5"><SectionTitle eyebrow="Telemetry" title="Monitoring workspace" description="Switch scenarios to see how the operator view responds." action={<select value={scenario} onChange={e => setScenario(e.target.value)} className="rounded-xl border border-white/90 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none shadow-sm"><option value="normal">Normal operation</option><option value="leak">Pipeline leak</option><option value="burst">Pipe burst</option><option value="demand">Demand spike</option><option value="sensor">Sensor anomaly</option></select>} /><div className="grid gap-4 md:grid-cols-3"><Metric label="Current flow" value={`${fmt(last.flow)} L/hr`} hint="Expected ≈ 8,000 L/hr" tone={last.flow > 9000 ? 'danger' : 'default'} /><Metric label="Pressure" value={`${last.pressure.toFixed(1)} bar`} hint="Expected ≈ 4.0 bar" tone={last.pressure < 3.6 ? 'danger' : 'default'} /><Metric label="Consumption" value={`${fmt(last.consumption)} L/hr`} hint="Expected ≈ 3,000 L/hr" tone={last.consumption > 3600 ? 'warning' : 'default'} /></div><TelemetryCharts data={data} /><Panel eyebrow="Latest readings" title="Telemetry table" action={<input type="text" placeholder="Filter by time..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl border border-white/80 bg-white/80 px-3 py-1.5 text-xs text-slate-700 outline-none" />}><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">Time</th><th>Flow</th><th>Pressure</th><th>Consumption</th><th>Anomaly Index</th><th>Status</th></tr></thead><tbody className="divide-y divide-slate-200/80">{filteredData.slice().reverse().map(row => { const abnormal = row.flow > 9000 || row.pressure < 3.6 || row.consumption > 3600; return <tr key={row.time}><td className="py-3 font-semibold text-slate-700">{row.time}</td><td className="text-slate-600">{fmt(row.flow)} L/hr</td><td className="text-slate-600">{row.pressure.toFixed(1)} bar</td><td className="text-slate-600">{fmt(row.consumption)} L/hr</td><td className="text-slate-600 font-mono text-xs">{row.anomalyScore ? row.anomalyScore.toFixed(2) : '0.02'}</td><td><Badge tone={abnormal ? 'warning' : 'success'}>{abnormal ? 'WARNING' : 'NORMAL'}</Badge></td></tr>})}</tbody></table></div></Panel></div>
}

function InvestigationPage({ active, verify, verified, onExport }) {
  const incident = incidents[0]
  return <div className="space-y-5"><SectionTitle eyebrow="Incident investigation" title="Why is the network abnormal?" description="A transparent breakdown of the current hypothesis and supporting evidence." action={<Badge tone={verified ? 'success' : 'warning'}>{verified ? 'Verified' : 'Needs verification'}</Badge>} />
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel eyebrow="Alert" title="Incident snapshot"><div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-slate-900">{active ? incident.title : 'No active incident'}</div><div className="mt-1 text-xs text-slate-500">{active ? `${incident.location} · ${incident.zone}` : 'Trigger a simulated incident from the command center.'}</div></div>{active && <Badge tone="danger">HIGH</Badge>}</div>{active && <div className="mt-5 grid gap-4 sm:grid-cols-2"><Metric label="Flow change" value="+31%" tone="danger" /><Metric label="Pressure change" value="-17%" tone="danger" /></div>}</div>{active && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white bg-white/65 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Probable location</div><div className="mt-2 text-xl font-bold text-slate-900">B2 → B3</div><div className="mt-1 text-sm text-slate-500">Localization confidence 81%</div></div><div className="rounded-2xl border border-white bg-white/65 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary hypothesis</div><div className="mt-2 text-xl font-bold text-slate-900">Pipeline leak</div><div className="mt-1 text-sm text-slate-500">AI-assisted ranking</div></div></div>}</Panel>
      <Panel eyebrow="Cause ranking" title="Possible explanations"><div className="space-y-3">{incident.causes.map(([cause, score]) => <div key={cause} className="rounded-xl border border-white/80 bg-white/60 p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{cause}</span><span className="font-bold text-sky-600">{active ? score : 0}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all duration-500" style={{ width: `${active ? score : 0}%` }} /></div></div>)}</div></Panel>
    </div>
    <Panel eyebrow="Evidence" title="Why the system believes this is a leak"><div className="grid gap-3 md:grid-cols-2">{incident.evidence.map((item) => <div key={item} className="flex gap-3 rounded-xl border border-white/80 bg-white/60 p-4"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">✓</span><p className="text-sm leading-6 text-slate-600">{item}</p></div>)}</div><div className="mt-5 flex flex-col gap-3 rounded-2xl bg-sky-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-bold text-slate-900">Scenario verification</div><div className="mt-1 text-sm text-slate-500">Compare the observed pattern with a simulated B2 → B3 leak.</div></div><div className="flex gap-2"><AppButton onClick={verify}>{verified ? 'Scenario verified ✓' : 'Verify scenario'}</AppButton><AppButton variant="soft" onClick={onExport}>Export JSON Report</AppButton></div></div></Panel>
  </div>
}

function ImpactPage({ active }) {
  return <div className="space-y-5"><SectionTitle eyebrow="Impact" title="Operational impact assessment" description="Translate the suspected fault into loss, exposure and severity." />{active ? <><div className="grid gap-4 md:grid-cols-3"><Metric label="Estimated water loss" value="3,500 L/hr" tone="danger" /><Metric label="24-hour loss projection" value="84,000 L" tone="danger" /><Metric label="Affected zone" value="Zone B" /></div><div className="grid gap-5 lg:grid-cols-2"><Panel eyebrow="Incident severity" title="Priority: High"><div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-slate-900">Immediate investigation recommended</div><div className="mt-1 text-sm text-slate-600">Potential loss is material and the affected segment is reasonably localized.</div></div><Badge tone="warning">HIGH</Badge></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Zone B users" value="560" /><Metric label="Suspected segment" value="B2 → B3" /></div></div></Panel><Panel eyebrow="Impact interpretation" title="What the operator should know"><div className="space-y-3 text-sm leading-6 text-slate-600"><p>• Estimated loss continues while the incident remains unresolved.</p><p>• Isolating the suspected segment may reduce losses but can affect service in Zone B.</p><p>• Final intervention remains with a qualified operator.</p></div></Panel></div></> : <Panel title="No active incident"><div className="py-12 text-center text-slate-500">Trigger the simulated leak to populate the impact assessment.</div></Panel>}</div>
}

function WhatIfPage({ active }) {
  const [option, setOption] = useState('isolate')
  const [ran, setRan] = useState(false)
  const [valveThrottle, setValveThrottle] = useState(50)
  const chosen = whatIfOptions[option]

  const calculatedLoss = useMemo(() => {
    if (option === 'reducePressure') {
      const factor = (100 - valveThrottle) / 100
      return Math.round(3500 * (0.45 + factor * 0.55))
    }
    return chosen.after.loss
  }, [option, valveThrottle, chosen])

  const reduction = Math.round(((chosen.before.loss - calculatedLoss) / chosen.before.loss) * 100)

  return <div className="space-y-5"><SectionTitle eyebrow="Decision support" title="What-If Studio" description="Compare intervention outcomes before taking action." action={<Badge tone="info">Operator controlled</Badge>} />{active ? <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><Panel eyebrow="Choose an action" title="Intervention scenario"><div className="space-y-3">{Object.entries(whatIfOptions).map(([key, item]) => <button key={key} onClick={() => { setOption(key); setRan(false) }} className={`w-full rounded-2xl border p-4 text-left transition ${option === key ? 'border-sky-300 bg-sky-50/80 shadow-sm' : 'border-white/80 bg-white/60 hover:bg-white'}`}><div className="flex items-center justify-between"><span className="font-bold text-slate-800">{item.label}</span><span className={`h-4 w-4 rounded-full border-2 ${option === key ? 'border-sky-500 bg-sky-500 ring-4 ring-sky-100' : 'border-slate-300'}`} /></div><p className="mt-2 text-sm leading-6 text-slate-500">{item.notes}</p></button>)}

  {option === 'reducePressure' && (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
      <div className="flex justify-between text-xs font-bold text-slate-700">
        <span>PRV Valve Throttle:</span>
        <span>{valveThrottle}%</span>
      </div>
      <input type="range" min="0" max="100" value={valveThrottle} onChange={e => setValveThrottle(Number(e.target.value))} className="mt-2 w-full accent-sky-500" />
    </div>
  )}

  <AppButton className="w-full" onClick={() => setRan(true)}>Run simulation</AppButton></div></Panel><Panel eyebrow="Scenario outcome" title={ran ? 'Simulated result' : 'Ready to simulate'}>{ran ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Loss reduction" value={`${reduction}%`} tone={reduction > 0 ? 'success' : 'default'} /><Metric label="After pressure" value={`${chosen.after.pressure.toFixed(1)} bar`} /><Metric label="Users affected" value={chosen.after.users} tone={chosen.after.users > 0 ? 'warning' : 'default'} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/80 bg-white/60 p-5"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Before</div><div className="mt-3 text-2xl font-bold text-slate-900">{fmt(chosen.before.loss)} <span className="text-sm font-semibold text-slate-500">L/hr</span></div><div className="mt-2 text-sm text-slate-500">Pressure {chosen.before.pressure.toFixed(1)} bar</div></div><div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5"><div className="text-xs font-bold uppercase tracking-wider text-sky-500">After</div><div className="mt-3 text-2xl font-bold text-slate-900">{fmt(calculatedLoss)} <span className="text-sm font-semibold text-slate-500">L/hr</span></div><div className="mt-2 text-sm text-slate-500">Pressure {chosen.after.pressure.toFixed(1)} bar</div></div></div><div className="rounded-2xl bg-slate-900 p-5 text-white"><div className="text-sm font-bold">Operator note</div><p className="mt-2 text-sm leading-6 text-slate-300">{chosen.notes}</p></div></div> : <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-xl text-sky-600">↔</div><div className="mt-4 font-bold text-slate-900">Select an intervention</div><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">HydraNexus will compare the expected consequences against the current incident state.</p></div>}</Panel></div> : <Panel title="No active incident"><div className="py-12 text-center text-slate-500">Trigger a simulated incident before running a what-if scenario.</div></Panel>}</div>
}

function HistoryPage({ setPage }) {
  const [filter, setFilter] = useState('')
  const filteredIncidents = incidents.filter(i => i.title.toLowerCase().includes(filter.toLowerCase()) || i.id.toLowerCase().includes(filter.toLowerCase()))

  return <div className="space-y-5"><SectionTitle eyebrow="History" title="Incident history" description="A lightweight record for the prototype environment." action={<input type="text" placeholder="Search history..." value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs text-slate-700 outline-none" />} /><Panel><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">Incident</th><th>Type</th><th>Location</th><th>Started</th><th>Severity</th><th>Status</th></tr></thead><tbody className="divide-y divide-slate-200/80">{filteredIncidents.map(item => <tr key={item.id}><td className="py-4"><div className="font-bold text-slate-800">{item.id}</div><div className="mt-0.5 text-xs text-slate-500">{item.title}</div></td><td className="text-slate-600">{item.type}</td><td className="text-slate-600">{item.location}</td><td className="text-slate-600">{item.started}</td><td><Badge tone={item.severity === 'HIGH' ? 'danger' : 'warning'}>{item.severity}</Badge></td><td><Badge tone={item.status === 'Resolved' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}</tbody></table></div><div className="mt-5 flex justify-end"><AppButton variant="soft" onClick={() => setPage('monitoring')}>Explore telemetry</AppButton></div></Panel></div>
}

function SettingsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notify, setNotify] = useState(true)
  return <div className="space-y-5"><SectionTitle eyebrow="Prototype" title="Settings" description="Keep the hackathon environment transparent and simple." /><div className="grid gap-5 lg:grid-cols-2"><Panel title="Operator preferences"><div className="space-y-3">{[[autoRefresh, setAutoRefresh, 'Auto-refresh telemetry', 'Refresh simulated readings in the dashboard'], [notify, setNotify, 'Incident notifications', 'Show visual alerts for new anomalies']].map(([value, setter, title, desc]) => <label key={title} className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/80 bg-white/60 p-4"><div><div className="font-semibold text-slate-800">{title}</div><div className="mt-1 text-sm text-slate-500">{desc}</div></div><input type="checkbox" checked={value} onChange={e => setter(e.target.checked)} className="h-5 w-5 accent-sky-500" /></label>)}</div></Panel><Panel title="Environment"><div className="space-y-2">{[['Data source', 'Simulated telemetry'], ['Analytics', 'Hybrid ML + rules (prototype)'], ['Network model', 'NetworkX topology'], ['Simulation', 'Mock scenario engine'], ['Deployment', 'React + Vite']].map(([a,b]) => <div key={a} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/55 px-4 py-3 text-sm"><span className="text-slate-500">{a}</span><span className="font-semibold text-slate-700">{b}</span></div>)}</div></Panel></div></div>
}

export default function App() {
  const [page, setPage] = useState('overview')
  const [active, setActive] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scenario, setScenario] = useState('normal')
  const [verified, setVerified] = useState(false)
  const [toast, setToast] = useState(null)

  const data = useMemo(() => active || scenario === 'leak' ? leakTelemetry : scenario === 'burst' ? burstTelemetry : scenario === 'demand' ? demandTelemetry : scenario === 'sensor' ? sensorTelemetry : normalTelemetry, [active, scenario])

  const trigger = () => {
    const next = !active
    setActive(next)
    setScenario(next ? 'leak' : 'normal')
    setVerified(false)
    setToast({
      message: next ? 'CRITICAL ALERT: Leak anomaly detected on segment B2 → B3!' : 'System returned to normal operational baseline.',
      type: next ? 'danger' : 'success'
    })
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
    setToast({ message: 'Incident report exported successfully!', type: 'success' })
  }

  const meta = pageMeta[page]
  const render = () => {
    if (page === 'overview') return <Overview active={active} data={data} setPage={setPage} trigger={trigger} onExport={exportReport} />
    if (page === 'network') return <NetworkPage active={active} />
    if (page === 'monitoring') return <MonitoringPage scenario={scenario} setScenario={s => { setScenario(s); setActive(s === 'leak') }} />
    if (page === 'incident') return <InvestigationPage active={active} verify={() => setVerified(true)} verified={verified} onExport={exportReport} />
    if (page === 'impact') return <ImpactPage active={active} />
    if (page === 'whatif') return <WhatIfPage active={active} />
    if (page === 'history') return <HistoryPage setPage={setPage} />
    return <SettingsPage />
  }

  return (
    <div className="min-h-screen bg-[#eef9ff] text-slate-800">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
      </div>
      <div className="relative lg:flex">
        <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} incidentActive={active} />
        <div className="min-w-0 flex-1">
          <PageHeader title={meta[0]} subtitle={meta[1]} onMenu={() => setMobileOpen(true)} onTrigger={trigger} incidentActive={active} />
          <main className="mx-auto max-w-[1540px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {render()}
            <footer className="border-t border-white/70 pt-5 pb-4 text-center text-xs text-slate-400">
              HydraNexus MVP · Software-first prototype · Human-in-the-loop decision support · Synthetic data for demonstration
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
