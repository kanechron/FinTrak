import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { type CashFlow } from '../../api/reports'
import { tooltipStyle, tooltipTextStyle, axisStyle, gridStroke, baselineStroke } from './chartTheme'

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

interface Props {
  data: CashFlow[]
  onPointClick?: (year: number, month: number) => void
}

export default function CashFlowChart({ data, onPointClick }: Props) {
  const chartData = data.map((d) => ({
    label: formatMonth(d.year, d.month),
    year: d.year,
    month: d.month,
    net: d.net,
  }))

  if (chartData.length === 0) {
    return <p className="text-center text-ink-3 text-sm py-12">No data for selected period</p>
  }

  // Where the "$0" line falls as a percentage of the chart's vertical range (0 = top, 100 = bottom).
  // Used below as a hard gradient stop so the line renders green above zero and red below it,
  // instead of one flat color regardless of sign.
  const values = chartData.map((d) => d.net)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const zeroPercent = max === min ? 50 : (max / (max - min)) * 100

  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netGradient" x1="0" y1="0%" x2="0" y2="100%">
            <stop offset={`${zeroPercent}%`} stopColor="var(--good)" />
            <stop offset={`${zeroPercent}%`} stopColor="var(--bad)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Net']}
          contentStyle={tooltipStyle}
          labelStyle={tooltipTextStyle}
          itemStyle={tooltipTextStyle}
        />
        <ReferenceLine y={0} stroke={baselineStroke} strokeWidth={1.5} />
        <Line
          type="monotone"
          dataKey="net"
          stroke="url(#netGradient)"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 5,
            style: { cursor: 'pointer' },
            onClick: ((_: unknown, p: { payload: { year: number; month: number } }) =>
              onPointClick?.(p.payload.year, p.payload.month)) as any,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
