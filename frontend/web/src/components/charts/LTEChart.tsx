import { Fragment, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { LTEForecastingResponse } from '../../api/reports'
import { formatCategoryName } from '../../utils/format'
import { parseLocalDate } from '../../utils/formatDate'
import { CATEGORY_COLORS, tooltipStyle, tooltipTextStyle, axisStyle, gridStroke } from './chartTheme'

const GHOST_COLOR = 'var(--ink-3)'
const GHOST_OPACITY = 0.35

interface Props {
  data: LTEForecastingResponse
  hoveredId?: string | null
  lockedIds: Set<string>
}

interface TooltipPayloadEntry {
  dataKey: string
  name: string
  value: number
  color: string
}

function formatMonth(iso: string) {
  return parseLocalDate(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Recharts' default Tooltip shows every series present at that x-position (shared-crosshair
// behavior) — with a dozen mostly-ghosted lines behind whichever one is active, that's noisy.
// This only renders the single series whose line the mouse is actually over.
function SingleSeriesTooltip({
  active,
  payload,
  label,
  hoveredKey,
}: {
  active?: boolean
  payload?: readonly TooltipPayloadEntry[]
  label?: string
  hoveredKey: string | null
}) {
  if (!active || !hoveredKey || !payload) return null
  const entry = payload.find((p) => p.dataKey === hoveredKey)
  if (!entry || entry.value == null) return null

  return (
    <div style={{ ...tooltipStyle, padding: '6px 10px' }}>
      <p style={{ ...tooltipTextStyle, marginBottom: 2 }}>{label}</p>
      <p style={{ color: entry.color, fontWeight: 600 }}>
        {entry.name}: ${entry.value.toFixed(2)}
      </p>
    </div>
  )
}

export default function LTEChart({ data, hoveredId, lockedIds }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const categories = data.categories

  if (categories.length === 0) {
    return <p className="text-center text-ink-3 text-sm py-12">Not enough history yet</p>
  }

  // One row per calendar month across the shared window, plus one extra row for the
  // projected month. Every category writes into the same rows so they all share one x-axis.
  const months = categories[0].dataPoints.map((p) => p.month)
  const projectedMonth = categories[0].projection.month

  const chartData: Record<string, string | number | undefined>[] = [
    ...months.map((month) => ({ label: formatMonth(month) })),
    { label: formatMonth(projectedMonth) },
  ]

  categories.forEach((cat) => {
    const actualKey = `${cat.categoryId}_actual`
    const forecastKey = `${cat.categoryId}_forecast`

    cat.dataPoints.forEach((point, i) => {
      chartData[i][actualKey] = point.monthlySum
      // The last real month also seeds the forecast series, so the dashed
      // projection segment visually connects to where the solid line ends.
      if (i === cat.dataPoints.length - 1) {
        chartData[i][forecastKey] = point.monthlySum
      }
    })
    chartData[chartData.length - 1][forecastKey] = cat.projection.monthlySum
  })

  // Stable per-category color assignment, by position in the API response — never by
  // lock/hover order, so locking one category can't repaint another already on screen.
  const colorFor = (categoryId: string) => {
    const index = categories.findIndex((c) => c.categoryId === categoryId)
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }

  const isActive = (categoryId: string) => lockedIds.has(categoryId) || hoveredId === categoryId

  // Ghosted lines render first so any active/locked line draws on top of them.
  const ordered = [...categories].sort((a, b) => Number(isActive(a.categoryId)) - Number(isActive(b.categoryId)))

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="label" tick={axisStyle} angle={-35} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          content={({ active, payload, label }) => (
            <SingleSeriesTooltip
              active={active}
              payload={payload as unknown as TooltipPayloadEntry[] | undefined}
              label={label as string | undefined}
              hoveredKey={hoveredKey}
            />
          )}
        />
        {ordered.map((cat) => {
          const active = isActive(cat.categoryId)
          const color = active ? colorFor(cat.categoryId) : GHOST_COLOR
          const displayName = formatCategoryName(cat.category)
          const actualKey = `${cat.categoryId}_actual`
          const forecastKey = `${cat.categoryId}_forecast`

          return (
            <Fragment key={cat.categoryId}>
              <Line
                type="monotone"
                dataKey={actualKey}
                name={displayName}
                stroke={color}
                strokeOpacity={active ? 1 : GHOST_OPACITY}
                strokeWidth={active ? 2.5 : 1.5}
                dot={false}
                activeDot={
                  active
                    ? {
                        r: 5,
                        style: { cursor: 'pointer' },
                        onMouseEnter: () => setHoveredKey(actualKey),
                        onMouseLeave: () => setHoveredKey(null),
                      }
                    : false
                }
                onMouseEnter={() => setHoveredKey(actualKey)}
                onMouseLeave={() => setHoveredKey(null)}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={forecastKey}
                name={`${displayName} (projected)`}
                stroke={color}
                strokeOpacity={active ? 1 : GHOST_OPACITY}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={
                  active
                    ? {
                        r: 5,
                        style: { cursor: 'pointer' },
                        onMouseEnter: () => setHoveredKey(forecastKey),
                        onMouseLeave: () => setHoveredKey(null),
                      }
                    : false
                }
                onMouseEnter={() => setHoveredKey(forecastKey)}
                onMouseLeave={() => setHoveredKey(null)}
                isAnimationActive={false}
              />
            </Fragment>
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
