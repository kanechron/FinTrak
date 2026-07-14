import { useState, useEffect } from 'react'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getCategoryDetailSpending } from '../../api/reports'
import type { CategorySpending } from '../../api/reports'

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
const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }
const tooltipTextStyle = { color: '#e5e7eb' }
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
}

export default function CategoryDetailCarousel({ categories, from, to, onSliceClick }: Props) {
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

  const detailTotal = data.reduce((sum, d) => sum + d.amount, 0)
  const uncategorized = current.amount - detailTotal

  const displayData = [
    ...data.map((d) => ({
      ...d,
      name: d.name.startsWith(current.name + '_') ? d.name.slice(current.name.length + 1) : d.name,
    })),
    ...(uncategorized > 0.005 ? [{ id: '', name: formatName(current.name), amount: uncategorized }] : []),
  ]

  const coloredData = displayData.map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }))

  return (
    <section className="border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">{formatName(current.name)}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {index + 1} / {categories.length}
          </span>
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(categories.length - 1, i + 1))}
            disabled={index === categories.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 text-sm py-12">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-12">No detailed breakdown available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={coloredData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
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
            <Legend formatter={formatName} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
