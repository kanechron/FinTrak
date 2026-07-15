import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { type Budget } from '../../api/budgets'
import { tooltipStyle, tooltipTextStyle, axisStyle, gridStroke, legendStyle } from './chartTheme'

interface Props {
  data: Budget[]
}

export default function BudgetPerformanceChart({ data }: Props) {
  const chartData = data.map((b) => ({
    name: b.name,
    Spent: Number(b.spent.toFixed(2)),
    Remaining: Number(Math.max(0, b.amount - b.spent).toFixed(2)),
  }))

  if (chartData.length === 0) {
    return <p className="text-center text-ink-3 text-sm py-12">No budgets found</p>
  }

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="name" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
          contentStyle={tooltipStyle}
          labelStyle={tooltipTextStyle}
          itemStyle={tooltipTextStyle}
        />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="Spent" stackId="budget" fill="var(--s6)" />
        <Bar dataKey="Remaining" stackId="budget" fill="var(--s1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
