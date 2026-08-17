import type { LTEForecastingResponse } from '../../api/reports'
import { formatCategoryName } from '../../utils/format'
import { parseLocalDate } from '../../utils/formatDate'
import { LockIcon, UnlockIcon } from '../common/icons'
import { CATEGORY_COLORS } from './chartTheme'

interface Props {
  data: LTEForecastingResponse
  hoveredId: string | null
  onHover: (categoryId: string | null) => void
  lockedIds: Set<string>
  onToggleLock: (categoryId: string) => void
}

function formatProjectedMonth(iso: string) {
  return parseLocalDate(iso).toLocaleDateString('en-US', { month: 'long'})
}

export default function LTECategoryList({ data, hoveredId, onHover, lockedIds, onToggleLock }: Props) {
  // Color assignment stays anchored to the original, unsorted order — shared with LTEChart's
  // own findIndex — so a category's color never changes based on display/sort order, and the
  // two components always agree on which color belongs to which category.
  const colorFor = (categoryId: string) => {
    const index = data.categories.findIndex((c) => c.categoryId === categoryId)
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }

  const sortedCategories = [...data.categories].sort(
    (a, b) => b.projection.monthlySum - a.projection.monthlySum
  )

  if (sortedCategories.length === 0) {
    return <p className="text-center text-ink-3 text-sm py-8">Not enough history yet</p>
  }

  const months = sortedCategories[0].dataPoints.map((p) => p.month)
  const recentMonth = months[months.length - 1]

  return (
    <div className="flex flex-col divide-y divide-line">
      {sortedCategories.map((cat) => {
        const locked = lockedIds.has(cat.categoryId)
        const active = locked || hoveredId === cat.categoryId
        const color = active ? colorFor(cat.categoryId) : 'var(--ink-3)'

        return (
          <div
            key={cat.categoryId}
            onMouseEnter={() => onHover(cat.categoryId)}
            onMouseLeave={() => onHover(null)}
          >
            <button
              onClick={() => onToggleLock(cat.categoryId)}
              className="w-full flex items-center gap-2.5 py-2.5 text-left group"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0 transition-colors"
                style={{ background: color }}
              />
              <span className="flex-1 min-w-0 truncate text-sm text-ink-2">
                {formatCategoryName(cat.category)}
              </span>
              <span className="text-sm text-ink font-semibold tabular-nums">
                {formatProjectedAmount(cat.projection.monthlySum)}
              </span>
              <span
                className={`shrink-0 text-ink-3 transition-opacity ${
                  locked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {locked ? <LockIcon /> : <UnlockIcon />}
              </span>
            </button>

            {locked && (
              <div className="pb-3 pl-5 pr-2 text-xs text-ink-3 space-y-2.5">
                <p>
                  You spent{' '}
                  <span className="text-ink-2 font-medium">
                    ${Math.abs(cat.dollarChange).toFixed(2)}
                  </span>{' '}
                  ({Math.abs(cat.percentChange).toFixed(1)}%){' '}
                  {cat.dollarChange >= 0 ? 'more' : 'less'} than average in this category in &nbsp;
                  <span className="text-ink-2 font-medium">
                    {formatProjectedMonth(recentMonth)}
                  </span>
                </p>
                <p>
                  Projected for {formatProjectedMonth(cat.projection.month)}:{' '}
                  <span className="text-ink-2 font-medium">
                    {formatProjectedAmount(cat.projection.monthlySum)}
                  </span>
                </p>
                <p>{cat.projectionConfidence}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatProjectedAmount(v: number) {
  return `$${v.toFixed(2)}`
}
