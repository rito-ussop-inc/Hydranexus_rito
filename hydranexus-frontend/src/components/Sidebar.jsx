const items = [
  ['overview', '⌂', 'Command Center'],
  ['network', '⌁', 'Network Map'],
  ['monitoring', '◔', 'Telemetry'],
  ['incident', '!', 'Investigation'],
  ['impact', '◒', 'Impact Assessment'],
  ['whatif', '↔', 'What-If Studio'],
  ['history', '◷', 'Incident History'],
]

export default function Sidebar({ page, setPage, mobileOpen, onClose, incidentActive }) {
  return <>
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-white/80 bg-white/55 p-5 shadow-[12px_0_45px_rgba(56,189,248,.07)] backdrop-blur-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-xl text-white shadow-[0_10px_24px_rgba(14,165,233,.25)]">💧</div><div><div className="text-base font-extrabold tracking-tight text-slate-900">HydraNexus</div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-500">Decision Intelligence</div></div></div>
      <div className="mt-7 rounded-2xl border border-white/80 bg-white/55 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Network mode</span><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.6)]" /></div><div className="mt-2 text-sm font-bold text-slate-800">{incidentActive ? 'Investigation active' : 'Operating normally'}</div><div className="mt-1 text-xs text-slate-500">Prototype · Synthetic telemetry</div></div>
      <nav className="mt-7 space-y-1">{items.map(([key, icon, label]) => <button key={key} onClick={() => { setPage(key); onClose() }} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${page === key ? 'bg-sky-100/90 text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${page === key ? 'bg-white text-sky-600' : 'bg-white/60 text-slate-400'}`}>{icon}</span><span>{label}</span>{key === 'incident' && incidentActive && <span className="ml-auto h-2 w-2 rounded-full bg-rose-400" />}</button>)}</nav>
      <div className="mt-auto"><button onClick={() => { setPage('settings'); onClose() }} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${page === 'settings' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/60">⚙</span>Settings</button><div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white"><div className="text-xs font-bold">Human-in-the-loop</div><p className="mt-1 text-[11px] leading-5 text-slate-300">HydraNexus supports decisions; qualified operators remain in control.</p></div></div>
    </div></aside>
  </>
}
