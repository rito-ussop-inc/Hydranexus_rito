import { memo } from 'react'

/**
 * TelemetryPulse — State-Aware Telemetry Heartbeat Indicator
 */
function TelemetryPulse({ active = false, rate = '1 Hz' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-950/80 bg-sky-950/30 px-2.5 py-1 text-[11px] font-mono text-sky-400 backdrop-blur-xs">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            active ? 'animate-ping bg-amber-400' : 'animate-ping bg-sky-400'
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            active ? 'bg-amber-500' : 'bg-sky-500'
          }`}
        />
      </span>
      <span className="text-slate-400">TELEMETRY</span>
      <span className="text-slate-300 font-semibold">{rate}</span>
    </div>
  )
}

export default memo(TelemetryPulse)
