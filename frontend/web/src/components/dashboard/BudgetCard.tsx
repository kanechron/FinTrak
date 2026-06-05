import ProgressBar from '../common/ProgressBar'
import { formatDate } from '../../utils/formatDate'
import { type Budget } from '../../api/budgets'

interface Props {
  budget: Budget
  onDelete: (id: string) => void
  onClick: () => void
}

export default function BudgetCard({ budget: b, onDelete, onClick }: Props) {
  return (
    <div onClick={onClick} className="space-y-2 border border-gray-800 rounded-lg p-3 cursor-pointer hover:border-gray-600 hover:bg-gray-800/40 transition-colors">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-200 font-medium">{b.name}</span>
          {b.isRecurring && (
            <span className="text-xs text-emerald-400 border border-emerald-800 rounded px-1.5 py-0.5">Recurring</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">${b.spent.toFixed(2)} / ${b.amount.toFixed(2)}</span>
          {/* stopPropagation prevents the card's onClick from firing when deleting */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(b.id) }}
            className="text-red-500 hover:text-red-400 transition-colors text-sm"
          >✕</button>
        </div>
      </div>
      {b.category && (
        <div className="text-xs text-gray-400">
          {b.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </div>
      )}
      <div className="text-xs text-gray-500">
        {b.period} · {formatDate(b.startDate)} - {formatDate(b.endDate)}
      </div>
      <ProgressBar value={b.spent} max={b.amount} />
    </div>
  )
}
