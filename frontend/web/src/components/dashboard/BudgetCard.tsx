import ProgressBar from '../common/ProgressBar'
import { formatDate } from '../../utils/formatDate'
import { type Budget } from '../../api/budgets'

interface Props {
  budget: Budget
  onDelete: (id: string) => void
  onClick: () => void
}

export default function BudgetCard({ budget: b, onDelete, onClick }: Props) {
  const pct = Math.round((b.spent / b.amount) * 100)
  const status = pct >= 100 ? 'critical' : pct >= 80 ? 'warning' : 'good'
  const chipClass = {
    good: 'text-good bg-good/15',
    warning: 'text-warn bg-warn/15',
    critical: 'text-bad bg-bad/15',
  }[status]

  return (
    <div onClick={onClick} className="group cursor-pointer">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-ink font-medium">{b.name}</span>
          {b.isRecurring && (
            <span className="text-xs text-good border border-good/40 rounded px-1.5 py-0.5">
              Recurring
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-2 tabular-nums">
            ${b.spent.toFixed(2)} / ${b.amount.toFixed(2)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chipClass}`}>{pct}%</span>
          {/* stopPropagation prevents the card's onClick from firing when deleting */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(b.id)
            }}
            className="text-ink-3 hover:text-bad transition-colors text-sm opacity-0 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
      {b.category && (
        <div className="text-xs text-ink-2 mb-1">
          {b.category
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
      )}
      <div className="text-xs text-ink-3 mb-2">
        {b.period} · {formatDate(b.startDate)} - {formatDate(b.endDate)}
      </div>
      <ProgressBar value={b.spent} max={b.amount} />
    </div>
  )
}
