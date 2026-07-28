import { useState, useEffect } from 'react'
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategoryDetailSpending } from '../../api/reports'
import type { CategorySpending } from '../../api/reports'
import { CATEGORY_COLORS, tooltipStyle, tooltipTextStyle } from './chartTheme'

const formatName = (v: string) =>
  v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())
const formatAmount = (v: unknown) => `$${(v as number).toFixed(2)}`

interface Props {
  categories: CategorySpending[]
  from?: string
  to?: string
  onSliceClick: (id: string, name: string) => void
  selectedId?: string
  onClose: () => void
}

export default function CategoryDetailCarousel({
  categories,
  from,
  to,
  onSliceClick,
  selectedId,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0)
  const [detailCache, setDetailCache] = useState<
    Record<string, { id: string; name: string; amount: number }[]>
  >({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (categories.length === 0) return
    setIndex(0)

    setLoading(true)
    Promise.all(
      categories.map((c) =>
        getCategoryDetailSpending(c.id, from, to).then((data) => ({ id: c.id, data }))
      )
    )
      .then((results) => {
        const cache: Record<string, { id: string; name: string; amount: number }[]> = {}
        results.forEach((r) => {
          cache[r.id] = r.data
        })
        setDetailCache(cache)
      })
      .finally(() => setLoading(false))
  }, [categories, from, to])

  if (categories.length === 0) return null

  const current = categories[index]
  const data = detailCache[current?.id] ?? []

  // Detailed subcategories don't always sum to the parent category's total — some
  // transactions only ever get a parent category assigned, never a detailed one. The gap
  // is shown as a synthetic "uncategorized" slice with id: '' (a sentinel, not a real
  // category — the click handlers below check for it and refuse to navigate on it).
  // 0.005 is a rounding-tolerance floor so cents-level float drift doesn't show a phantom sliver.
  const detailTotal = data.reduce((sum, d) => sum + d.amount, 0)
  const uncategorized = current.amount - detailTotal

  const displayData = [
    // Detailed category names are stored as "PARENT_CHILD" (e.g. "FOOD_AND_DRINK_RESTAURANT") —
    // strip the parent's prefix so the legend/tooltip shows just "Restaurant".
    ...data.map((d) => ({
      ...d,
      name: d.name.startsWith(current.name + '_') ? d.name.slice(current.name.length + 1) : d.name,
    })),
    ...(uncategorized > 0.005
      ? [{ id: '', name: formatName(current.name), amount: uncategorized }]
      : []),
  ]

  const coloredData = displayData.map((item, i) => ({
    ...item,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-medium text-ink">{formatName(current.name)}</h2>
          <p className="text-xs text-ink-3 mt-0.5">Detailed breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-3">
            {index + 1} / {categories.length}
          </span>
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-line text-ink-3 hover:text-ink hover:border-line-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(categories.length - 1, i + 1))}
            disabled={index === categories.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-line text-ink-3 hover:text-ink hover:border-line-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
          <button
            onClick={onClose}
            aria-label="Close detailed breakdown"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-2 text-lg hover:bg-raised transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-ink-3 text-sm py-12">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-ink-3 text-sm py-12">No detailed breakdown available.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] uppercase tracking-wider text-ink-3">Spent</span>
              <span className="text-lg font-bold text-ink mt-0.5">
                {formatAmount(current.amount)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coloredData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={68}
                  onClick={(data) => {
                    if (data.payload.id) onSliceClick(data.payload.id, data.payload.name)
                  }}
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
                key={d.id || d.name}
                onClick={() => d.id && onSliceClick(d.id, d.name)}
                disabled={!d.id}
                className={`flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg transition-colors text-left ${
                  !d.id ? 'cursor-default' : selectedId === d.id ? 'bg-raised' : 'hover:bg-raised'
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
    </section>
  )
}
