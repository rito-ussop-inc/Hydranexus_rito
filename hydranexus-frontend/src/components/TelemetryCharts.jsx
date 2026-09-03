import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Panel from './Panel'

function CustomTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="rounded-2xl border border-white/90 bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(14,165,233,.12)] backdrop-blur-md">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="mt-1 text-base font-extrabold text-slate-900">
          {Number(val).toLocaleString()} <span className="text-xs font-semibold text-sky-600">{unit}</span>
        </div>
      </div>
    )
  }
  return null
}

function Chart({ title, unit, data, dataKey, color, gradientId }) {
  return (
    <Panel title={title} action={<span className="text-xs font-bold text-slate-400">Live feed</span>}>
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export default function TelemetryCharts({ data }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Chart title="Flow Rate" unit="L/hr" data={data} dataKey="flow" color="#0ea5e9" gradientId="flowGrad" />
      <Chart title="Avg Pressure" unit="bar" data={data} dataKey="pressure" color="#06b6d4" gradientId="pressGrad" />
      <Chart title="Consumption" unit="L/hr" data={data} dataKey="consumption" color="#3b82f6" gradientId="consGrad" />
    </div>
  )
}
