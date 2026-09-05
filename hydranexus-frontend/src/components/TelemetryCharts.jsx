import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'

function MinimalTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background px-2.5 py-1.5 text-xs shadow-sm">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-medium">
          {Number(payload[0].value).toLocaleString()} {unit}
        </div>
      </div>
    )
  }
  return null
}

function Chart({ title, unit, data, dataKey }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-xs text-muted-foreground">Simulated feed</span>
      </CardHeader>
      <CardContent>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
              <Tooltip content={<MinimalTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="hsl(var(--primary))"
                fillOpacity={0.12}
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
    <div className="grid gap-4 xl:grid-cols-3">
      <Chart title="Flow rate" unit="L/hr" data={data} dataKey="flow" />
      <Chart title="Pressure" unit="bar" data={data} dataKey="pressure" />
      <Chart title="Consumption" unit="L/hr" data={data} dataKey="consumption" />
    </div>
  )
}
