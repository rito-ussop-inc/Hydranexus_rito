import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from './ui/card'

function MinimalTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-xs backdrop-blur-xs">
        <div className="text-slate-400 font-medium text-[10px]">{label}</div>
        <div className="font-semibold text-slate-800">
          {Number(payload[0].value).toLocaleString()} {unit}
        </div>
      </div>
    )
  }
  return null
}

function SparkCard({ title, unit, data, dataKey, yDomain, yTicks, baseline, higherIsBad = true }) {
  const lastVal = data?.at(-1)?.[dataKey] ?? baseline
  const diffPct = baseline ? Math.round(((lastVal - baseline) / baseline) * 100) : 0
  const isDeviation = Math.abs(diffPct) >= 3

  let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200'
  if (isDeviation) {
    if ((diffPct > 0 && higherIsBad) || (diffPct < 0 && !higherIsBad)) {
      badgeColor = 'bg-red-50 text-red-600 border-red-100'
    } else {
      badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100'
    }
  }

  const arrow = diffPct > 0 ? '↑' : diffPct < 0 ? '↓' : '—'
  const badgeText = `${arrow} ${Math.abs(diffPct)}%`

  // Format yTicks label
  const formatY = (val) => {
    if (val >= 1000) return `${val / 1000}K`
    return String(val)
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-2xs hover:shadow-xs transition-shadow">
      <CardContent className="p-3.5 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain || ['auto', 'auto']}
                ticks={yTicks}
                tickFormatter={formatY}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<MinimalTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#0284c7"
                strokeWidth={2}
                fill={`url(#grad-${dataKey})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TelemetryCharts({ data, showAll = false }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <SparkCard
        title="Flow rate (L/hr)"
        unit="L/hr"
        data={data}
        dataKey="flow"
        baseline={8000}
        yDomain={[0, 16000]}
        yTicks={[0, 8000, 16000]}
        higherIsBad={true}
      />
      <SparkCard
        title="Pressure (bar)"
        unit="bar"
        data={data}
        dataKey="pressure"
        baseline={4.0}
        yDomain={[0, 8]}
        yTicks={[0, 4, 8]}
        higherIsBad={false}
      />
      <SparkCard
        title="Consumption (L/hr)"
        unit="L/hr"
        data={data}
        dataKey="consumption"
        baseline={3000}
        yDomain={[0, 4500]}
        yTicks={[0, 1600, 3200]}
        higherIsBad={true}
      />
      <SparkCard
        title="Tank level (m)"
        unit="m"
        data={data}
        dataKey="level"
        baseline={3.2}
        yDomain={[0, 4]}
        yTicks={[0, 1.7, 3.4]}
        higherIsBad={false}
      />
      {showAll && (
        <div className="sm:col-span-2 lg:col-span-4">
          <SparkCard
            title="Structural integrity (eddy current variance)"
            unit="variance"
            data={data}
            dataKey="eddy_current_variance"
            baseline={0.02}
            yDomain={[0, 1]}
            yTicks={[0, 0.5, 1]}
            higherIsBad={true}
          />
        </div>
      )}
    </div>
  )
}
