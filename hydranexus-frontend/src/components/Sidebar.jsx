import {
  LayoutDashboard,
  Network,
  Activity,
  FileSearch,
  Gauge,
  FlaskConical,
  History,
  Settings,
  Droplets,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Badge } from './ui/badge'

const items = [
  ['overview', LayoutDashboard, 'Overview'],
  ['network', Network, 'Network'],
  ['monitoring', Activity, 'Telemetry'],
  ['incident', FileSearch, 'Investigation'],
  ['impact', Gauge, 'Impact'],
  ['whatif', FlaskConical, 'What-If'],
  ['history', History, 'History'],
]

export default function Sidebar({ page, setPage, mobileOpen, onClose, incidentActive }) {
  return (
    <>
      {mobileOpen && (
        <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 transform flex-col border-r bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 pt-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Droplets className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">HydraNexus</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-xs text-muted-foreground">{incidentActive ? 'Investigating' : 'Normal'}</span>
            {incidentActive ? (
              <Badge variant="destructive">Active</Badge>
            ) : (
              <Badge variant="secondary">Idle</Badge>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {items.map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => {
                setPage(key)
                onClose()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                page === key
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {key === 'incident' && incidentActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-destructive" />}
            </button>
          ))}
        </nav>

        <div className="border-t p-2">
          <button
            onClick={() => {
              setPage('settings')
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              page === 'settings'
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </button>
          <p className="px-3 pb-2 pt-3 text-[11px] leading-4 text-muted-foreground">
            Decision support only. Operators remain in control.
          </p>
        </div>
      </aside>
    </>
  )
}
