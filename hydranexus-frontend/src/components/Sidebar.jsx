import {
  Home,
  Network,
  Activity,
  Search,
  Gauge,
  FlaskConical,
  History,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Badge } from './ui/badge'

const items = [
  ['overview', Home, 'Overview'],
  ['network', Network, 'Network'],
  ['monitoring', Activity, 'Telemetry'],
  ['incident', Search, 'Investigation'],
  ['impact', Gauge, 'Impact'],
  ['whatif', FlaskConical, 'What-If'],
  ['history', History, 'History'],
]

export default function Sidebar({ page, setPage, mobileOpen, onClose, incidentActive }) {
  return (
    <>
      {mobileOpen && (
        <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900 leading-tight">HydraNexus</span>
              <span className="block text-[10px] text-slate-400 font-medium leading-3">Smarter Networks.<br />Safer Communities.</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {items.map(([key, Icon, label]) => {
            const isActive = page === key
            return (
              <button
                key={key}
                onClick={() => {
                  setPage(key)
                  onClose()
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
                <span>{label}</span>
                {key === 'incident' && incidentActive && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer & Ambient Waves */}
        <div className="relative mt-auto border-t border-slate-100 p-3 pt-3">
          <button
            onClick={() => {
              setPage('settings')
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              page === 'settings'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Settings className="h-4 w-4 shrink-0 text-slate-400" />
            Settings
          </button>

          {/* Slogan & Decorative Wave */}
          <div className="relative mt-4 overflow-hidden rounded-xl bg-gradient-to-b from-sky-50/60 to-blue-50/80 p-4 border border-blue-100/40">
            <svg className="absolute -bottom-2 -left-2 right-0 w-[120%] h-12 opacity-35 text-blue-400 pointer-events-none" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,15 C20,5 40,25 60,15 C80,5 100,20 120,10 L120,25 L0,25 Z" />
            </svg>
            <p className="relative z-10 text-[11px] font-medium leading-4 text-slate-500">
              Clean water.<br />
              <span className="text-slate-600 font-semibold">Stronger tomorrow.</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
