import { useState } from 'react'
import { deleteBudget, type Budget } from '../../api/budgets'
import AddBudgetModal from '../modals/AddBudgetModal'
import EditBudgetModal from '../modals/EditBudgetModal'
import BudgetCard from './BudgetCard'

interface Props {
  budgets: Budget[]
  onBudgetAdded: () => void
}

export default function BudgetList({ budgets, onBudgetAdded }: Props) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id)
      onBudgetAdded()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  return (
    <section>
      <AddBudgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={onBudgetAdded}
      />
      {selectedBudget && (
        <EditBudgetModal
          budget={selectedBudget}
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onSuccess={() => {
            setSelectedBudget(null)
            onBudgetAdded()
          }}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-ink">Budgets</h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity"
        >
          + Add Budget
        </button>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-ink-3 text-center py-4">
          No budgets yet — add one to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onDelete={handleDelete}
              onClick={() => setSelectedBudget(b)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
