import { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { tooltipStyle, tooltipTextStyle, axisStyle, gridStroke, selectClass } from './chartTheme'

export interface MonthlySpending {
  year: number
  month: number
  amount: number
}

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

interface Props {
  data: MonthlySpending[]
  onPointClick: (year: number, month: number) => void
}

export default function MonthlySpendingChart({ data, onPointClick }: Props) {
  const [chartType, setChartType] = useState('Line')

  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.year, d.month) }))

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-medium text-ink">Monthly Spending</h2>
          <p className="text-xs text-ink-3 mt-0.5">Total spend over selected period</p>
        </div>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className={selectClass}
        >
          <option>Line</option>
          <option>Area</option>
          <option>Bar</option>
        </select>
      </div>
      {chartData.length === 0 ? (
        <p className="text-center text-ink-3 text-sm py-12">No data for selected period</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'Bar' ? (
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Bar
                dataKey="amount"
                fill="var(--s1)"
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
                onClick={(d) => onPointClick((d as any).year, (d as any).month)}
              />
            </BarChart>
          ) : chartType === 'Area' ? (
            <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--s1)"
                fill="var(--s1)"
                fillOpacity={0.15}
                activeDot={{ r: 5, style: { cursor: 'pointer' }, onClick: ((_: unknown, p: { payload: MonthlySpending }) => onPointClick(p.payload.year, p.payload.month)) as any }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--s1)"
                strokeWidth={2}
                dot={{ fill: 'var(--s1)', r: 3 }}
                activeDot={{ r: 5, style: { cursor: 'pointer' }, onClick: ((_: unknown, p: { payload: MonthlySpending }) => onPointClick(p.payload.year, p.payload.month)) as any }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </>
  )
}
