import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { type CategorySpending } from '../../api/reports'

const COLORS = [
  '#818cf8',
  '#34d399',
  '#f472b6',
  '#fb923c',
  '#38bdf8',
  '#a78bfa',
  '#facc15',
  '#4ade80',
]
const selectClass =
  'bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-400 px-2 py-1 focus:outline-none focus:border-gray-500'
const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }
const tooltipTextStyle = { color: '#e5e7eb' }
const formatName = (v: string) =>
  v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())
const formatAmount = (v: unknown) => `$${(v as number).toFixed(2)}`

interface Props {
  data: CategorySpending[]
}

export default function CategorySpendingChart({ data }: Props) {
  const [chartType, setChartType] = useState('Pie')

  return (
    <section className="border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Spending by Category</h2>
          <p className="text-xs text-gray-500 mt-0.5">Breakdown for selected period</p>
        </div>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className={selectClass}
        >
          <option>Pie</option>
          <option>Donut</option>
          <option>Bar</option>
        </select>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-12">No data for selected period</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'Bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickFormatter={formatName}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={formatAmount}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={chartType === 'Donut' ? 55 : 0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={formatAmount}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Legend formatter={formatName} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </section>
  )
}
