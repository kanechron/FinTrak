import type { SADReportResponse } from '../../api/reports'
import { formatCategoryName } from '../../utils/format'

interface Props {
  data: SADReportResponse
}

const SEVERITY: Record<string, number> = {
  'Unusually high compared to your typical spending': 2,
  'Higher than your typical spending': 1,
  'Typical for this category': 0,
  'Lower than your typical spending': 0,
  'Unusually low compared to your typical spending': 0,
}

const CHIP_CLASS: Record<number, string> = {
  2: 'text-bad bg-bad/15',
  1: 'text-warn bg-warn/15',
  0: 'text-good bg-good/15',
}

function formatRunningTotal(v: number) {
  return `$${v.toFixed(2)}`
}

export default function SADWidget({ data }: Props) {
  // Worst offenders first — this widget exists to be scanned at a glance, not sorted through.
  const sortedCategories = [...data.categories].sort(
    (a, b) => a.percentChange - b.percentChange)

  return (
    <section>
      <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-2">Spending Alerts</p>

      {sortedCategories.length === 0 ? (
        <p className="text-sm text-ink-3 py-8">Not enough history yet</p>
      ) : (
        <div className="flex flex-col divide-y divide-line mt-1">
          {sortedCategories.map((cat) => {
            const severity = SEVERITY[cat.deviationLabel] ?? 0
            return (
              <div key={cat.categoryId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-2 truncate">
                    {formatCategoryName(cat.category)}
                  </p>
                  <p className="text-[11.5px] text-ink-3 mt-0.5">
                    {Math.abs(cat.dollarChange).toFixed(2) !== '0.00' && (
                      <>
                        ${Math.abs(cat.dollarChange).toFixed(2)}{' '}
                        {cat.dollarChange >= 0 ? 'above' : 'below'} your average month{' · '}
                      </>
                    )}
                    {cat.deviationLabel}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-lg font-semibold tabular-nums text-ink">
                    {formatRunningTotal(cat.runningTotal)}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${CHIP_CLASS[severity]}`}
                  >
                    {cat.percentChange >= 0 ? '+' : ''}
                    {Math.round(cat.percentChange)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
