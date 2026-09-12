import { Menu, Play, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

export default function PageHeader({
  title,
  subtitle,
  onMenu,
  onTrigger,
  incidentActive,
  backendOnline = false,
  scenario = 'normal',
  onScenarioChange,
  onReplayBriefing,
}) {
  const scenarios = [
    ['normal', 'Normal baseline'],
    ['leak', 'Pipeline leak'],
    ['burst', 'Pipe burst'],
    ['demand', 'Demand spike'],
    ['sensor', 'Sensor fault'],
    ['corrosion', 'Early corrosion'],
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0c1626]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button variant="ghost" size="icon" onClick={onMenu} className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-xs font-mono text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {/* Briefing Replay Button */}
          {onReplayBriefing && (
            <button
              onClick={onReplayBriefing}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-sky-800/70 bg-sky-950/40 px-2.5 py-1 text-xs font-mono text-sky-300 hover:bg-sky-900/60 hover:text-white transition-colors cursor-pointer"
              title="Replay cinematic system briefing"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Briefing</span>
            </button>
          )}

          {/* Scenario Selector */}
          {onScenarioChange && (
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs font-mono font-medium text-slate-200 shadow-xs transition-colors hover:border-slate-600 focus:outline-none focus:border-sky-500"
              aria-label="Simulation scenario"
            >
              {scenarios.map(([val, label]) => (
                <option key={val} value={val} className="bg-slate-900 text-slate-200">
                  {label}
                </option>
              ))}
            </select>
          )}

          {/* Live Backend Indicator */}
          {backendOnline ? (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 text-xs font-mono font-medium text-cyan-400"
              title="Connected to Render FastAPI Live Backend"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              API LIVE
            </span>
          ) : (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-400"
              title="Connecting to backend..."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              API SYNCING
            </span>
          )}

          {/* System Status Pill */}
          {incidentActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/70 border border-red-800/80 px-2.5 py-1 text-xs font-mono font-semibold text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              ANOMALY ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              NOMINAL
            </span>
          )}

          {/* Demo Trigger Button */}
          <Button
            size="sm"
            variant={incidentActive ? 'outline' : 'default'}
            onClick={onTrigger}
            className={
              incidentActive
                ? 'border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white h-8 text-xs font-mono'
                : 'bg-sky-600 hover:bg-sky-500 text-white h-8 text-xs font-mono font-medium shadow-xs shadow-sky-600/30'
            }
          >
            {incidentActive ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Resolve demo
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Trigger demo
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
