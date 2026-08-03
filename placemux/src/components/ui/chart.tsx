import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#6c5ce7', '#a29bfe', '#74b9ff', '#00b894', '#fdcb6e', '#e74c3c']

interface TooltipContentProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-xl backdrop-blur-xl">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || COLORS[i] }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

interface LineChartProps {
  data: Record<string, unknown>[]
  lines: { dataKey: string; color?: string; name?: string }[]
  xKey: string
  height?: number
}

export function LineChartWidget({ data, lines, xKey, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color || COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, fill: line.color || COLORS[i % COLORS.length] }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps {
  data: Record<string, unknown>[]
  bars: { dataKey: string; color?: string; name?: string }[]
  xKey: string
  height?: number
}

export function BarChartWidget({ data, bars, xKey, height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color || COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface AreaChartProps {
  data: Record<string, unknown>[]
  areas: { dataKey: string; color?: string; name?: string }[]
  xKey: string
  height?: number
}

export function AreaChartWidget({ data, areas, xKey, height = 300 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {areas.map((area, i) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stroke={area.color || COLORS[i % COLORS.length]}
            fill={area.color || COLORS[i % COLORS.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface PieChartProps {
  data: { name: string; value: number; color?: string }[]
  height?: number
  innerRadius?: number
}

export function PieChartWidget({ data, height = 300, innerRadius = 60 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 40}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span className="text-foreground/70">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
