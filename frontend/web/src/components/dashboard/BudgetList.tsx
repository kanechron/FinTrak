import { useState } from 'react'
import ProgressBar from '../common/ProgressBar'
import { deleteBudget, type Budget } from '../../api/budgets'
import AddBudgetModal from '../modals/AddBudgetModal'

interface Props {
  budgets: Budget[]
  onBudgetAdded: () => void
}

function formatDate(date: string | null) {
  if (!date) return '—'
  const d = new Date(date.includes('T') ? date : date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


export default function BudgetList({ budgets, onBudgetAdded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  
  const handleDelete = async (id: string) => {
  try {
    await deleteBudget(id);
    onBudgetAdded();
  }
  catch (error) {
      console.error('Failed to delete budget:', error);
  }
}

  return (
    <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
      <AddBudgetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={onBudgetAdded} />
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Budgets</h2>
        <button onClick={() => setModalOpen(true)} className="text-md text-blue-500 hover:text-blue-400 cursor-pointer">
          + Add Budget
        </button>
      </div>

      
      <div className="space-y-4">
        {budgets.map((b) => {
          const endDate = b.endDate
          return (
            <div key={b.id} className="space-y-2 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 font-medium">{b.name}</span>
                  {b.isRecurring && (
                    <span className="text-xs text-emerald-400 border border-emerald-800 rounded px-1.5 py-0.5">Recurring</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">${b.spent.toFixed(2)} / ${b.amount.toFixed(2)}</span>
                  <button onClick={() => handleDelete(b.id)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {b.period} · {formatDate(b.startDate)} - {formatDate(endDate)}
              </div>
              <ProgressBar value={b.spent} max={b.amount} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
