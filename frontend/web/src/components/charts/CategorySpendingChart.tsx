import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { type CategorySpending } from '../../api/reports'
import {
  CATEGORY_COLORS,
  tooltipStyle,
  tooltipTextStyle,
  axisStyle,
  gridStroke,
} from './chartTheme'

const formatName = (v: string) =>
  v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())
const formatAmount = (v: unknown) => `$${(v as number).toFixed(2)}`

interface Props {
  data: CategorySpending[]
  onSliceClick: (id: string, name: string) => void
  selectedId?: string
  chartType: string
}

export default function CategorySpendingChart({
  data,
  onSliceClick,
  selectedId,
  chartType,
}: Props) {
  const coloredData = data.map((item, i) => ({
    ...item,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <>
      {data.length === 0 ? (
        <p className="text-center text-ink-3 text-sm py-12">No data for selected period</p>
      ) : chartType === 'Bar' ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={coloredData} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              angle={-35}
              textAnchor="end"
              interval={0}
              tickFormatter={formatName}
            />
            <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={formatAmount}
              contentStyle={tooltipStyle}
              labelStyle={tooltipTextStyle}
              itemStyle={tooltipTextStyle}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center items-center gap-6 sm:gap-10">
          <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
            {chartType === 'Donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] uppercase tracking-wider text-ink-3">Spent</span>
                <span className="text-lg font-bold text-ink mt-0.5">{formatAmount(total)}</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coloredData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={chartType === 'Donut' ? 68 : 0}
                  onClick={(data) => onSliceClick(data.payload.id, data.payload.name)}
                  style={{ cursor: 'pointer' }}
                />
                <Tooltip
                  formatter={formatAmount}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipTextStyle}
                  itemStyle={tooltipTextStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-0 flex flex-col gap-0.5 max-h-[280px] overflow-y-auto pr-1">
            {coloredData.map((d) => (
              <button
                key={d.id}
                onClick={() => onSliceClick(d.id, d.name)}
                className={`flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg transition-colors text-left ${
                  selectedId === d.id ? 'bg-raised' : 'hover:bg-raised'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
                <span className="flex-1 min-w-0 truncate text-ink-2">{formatName(d.name)}</span>
                <span className="text-ink font-semibold tabular-nums">
                  {formatAmount(d.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
