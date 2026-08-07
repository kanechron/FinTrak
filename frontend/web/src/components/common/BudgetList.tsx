import { useState } from 'react'
import { deleteBudget, type Budget } from '../../api/budgets'
import BudgetFormModal from '../modals/BudgetFormModal'
import BudgetCard from './BudgetCard'
import { useToast } from '../../hooks/ToastProvider'

interface Props {
  budgets: Budget[]
  onBudgetChange: () => void
}

export default function BudgetList({ budgets, onBudgetChange }: Props) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const toast = useToast()

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id)
      toast.success({ title: 'Budget deleted', content: '' })
    } catch {
      toast.error({ title: 'Failed to delete budget', content: 'Please try again.' })
    }
  }

  return (
    <section>
      <BudgetFormModal
        isOpen={addModalOpen || !!selectedBudget}
        budget={selectedBudget ?? undefined}
        onClose={() => {
          setAddModalOpen(false)
          setSelectedBudget(null)
        }}
        onSuccess={() => {
          setAddModalOpen(false)
          setSelectedBudget(null)
          onBudgetChange()
        }}
      />
      <h2 className="font-medium text-ink mb-4">Budgets</h2>
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
      <button
        onClick={() => setAddModalOpen(true)}
        className="w-full text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity mt-5 pt-4 border-t border-line"
      >
        + Add Budget
      </button>
    </section>
  )
}
