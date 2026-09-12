import { useState, useEffect } from 'react'
import { Menu, Play, RotateCcw, Search, Bell, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'

export default function PageHeader({ title, subtitle, onMenu, onTrigger, incidentActive, scenario = 'normal', onScenarioChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const dStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      const tStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      setTimeStr(`${dStr}  ${tStr}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  const scenarios = [
    ['normal', 'Normal baseline'],
    ['leak', 'Pipeline leak'],
    ['burst', 'Pipe burst'],
    ['demand', 'Demand spike'],
    ['sensor', 'Sensor fault'],
    ['corrosion', 'Early corrosion'],
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Mobile menu button & Universal Search */}
        <div className="flex flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenu} className="lg:hidden text-slate-600" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>

          {/* Search Bar matching Reference UI */}
          <div className="relative max-w-md flex-1 hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes, incidents, or insights..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-12 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
                ⌘ K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Scenario Selector Dropdown */}
          {onScenarioChange && (
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none"
              aria-label="Simulation scenario"
            >
              {scenarios.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          )}

          {/* Status Badge */}
          {incidentActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/90 px-3 py-1 text-xs font-semibold text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Incident active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              All systems normal
            </span>
          )}

          {/* Trigger Demo Button */}
          <Button
            size="sm"
            variant={incidentActive ? 'outline' : 'default'}
            onClick={onTrigger}
            className={incidentActive ? 'border-red-200 text-red-700 hover:bg-red-50' : 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs text-xs font-medium h-8'}
          >
            {incidentActive ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Resolve demo
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" /> Trigger demo
              </>
            )}
          </Button>

          {/* Date / Time */}
          <span className="hidden xl:inline text-xs text-slate-400 font-medium whitespace-nowrap pl-1">
            {timeStr || 'Wed, 10 Sep 2026  15:24'}
          </span>

          {/* Notifications Bell */}
          <button
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 sm:border-l sm:border-slate-200/80 sm:pl-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-semibold shadow-2xs">
              RS
            </div>
            <span className="hidden sm:inline text-xs font-medium text-slate-800">
              Ritresa Sinha Roy
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
