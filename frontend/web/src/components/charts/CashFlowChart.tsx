import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { type CashFlow } from '../../api/reports'

const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }
const tooltipTextStyle = { color: '#e5e7eb' }
const axisStyle = { fill: '#6b7280', fontSize: 11 }

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

interface Props {
  data: CashFlow[]
}

export default function CashFlowChart({ data }: Props) {
  const chartData = data.map(d => ({
    label: formatMonth(d.year, d.month),
    net: d.net,
  }))

  if (chartData.length === 0) {
    return <p className="text-center text-gray-500 text-sm py-12">No data for selected period</p>
  }

  const values = chartData.map(d => d.net)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const zeroPercent = max === min ? 50 : (max / (max - min)) * 100

  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netGradient" x1="0" y1="0%" x2="0" y2="100%">
            <stop offset={`${zeroPercent}%`} stopColor="#4ade80" />
            <stop offset={`${zeroPercent}%`} stopColor="#f87171" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={v => `$${v}`} />
        <Tooltip
          formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Net']}
          contentStyle={tooltipStyle}
          labelStyle={tooltipTextStyle}
          itemStyle={tooltipTextStyle}
        />
        <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
        <Line type="monotone" dataKey="net" stroke="url(#netGradient)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
