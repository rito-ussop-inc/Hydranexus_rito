import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'

function MinimalTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-[#0c1626]/95 backdrop-blur-md px-3 py-2 text-xs shadow-xl text-slate-100 font-mono">
        <div className="text-slate-400 text-[10px] uppercase tracking-wider">{label}</div>
        <div className="font-semibold text-cyan-400 mt-0.5">
          {Number(payload[0].value).toLocaleString()} <span className="text-slate-400 font-normal">{unit}</span>
        </div>
      </div>
    )
  }
  return null
}

function Chart({ title, unit, data, dataKey, color = '#0284c7' }) {
  const gradId = `telemetry-grad-${dataKey}`
  return (
    <Card className="border-slate-800/80 bg-[#0c1626]/85 backdrop-blur-sm shadow-lg shadow-black/20 hover:border-cyan-500/30 transition-all duration-200">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <CardTitle className="text-sm font-medium text-slate-200 tracking-tight">{title}</CardTitle>
        </div>
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Simulated feed</span>
      </CardHeader>
      <CardContent>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={50} />
              <Tooltip content={<MinimalTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TelemetryCharts({ data }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Chart title="Flow rate" unit="L/hr" data={data} dataKey="flow" color="#0284c7" />
      <Chart title="Pressure" unit="bar" data={data} dataKey="pressure" color="#06b6d4" />
      <Chart title="Consumption" unit="L/hr" data={data} dataKey="consumption" color="#3b82f6" />
      <Chart title="Tank level" unit="m" data={data} dataKey="level" color="#10b981" />
      <Chart title="Structural integrity (eddy current)" unit="0–1 variance" data={data} dataKey="eddy_current_variance" color="#f59e0b" />
    </div>
  )
}

