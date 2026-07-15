import { useEffect, useState } from 'react'
import { getBudgets, deleteBudget, type Budget } from '../../api/budgets'
import { getAccounts, type Account } from '../../api/accounts'
import BalanceCard from '../../components/dashboard/BalanceCard'
import BudgetCard from '../../components/dashboard/BudgetCard'
import AddBudgetModal from '../../components/modals/AddBudgetModal'
import EditBudgetModal from '../../components/modals/EditBudgetModal'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const fetchBudgets = () => getBudgets().then(setBudgets)

  useEffect(() => {
    fetchBudgets()
    getAccounts().then(setAccounts)
  }, [])

  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id)
      fetchBudgets()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <AddBudgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchBudgets}
      />
      {selectedBudget && (
        <EditBudgetModal
          budget={selectedBudget}
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onSuccess={() => {
            setSelectedBudget(null)
            fetchBudgets()
          }}
        />
      )}

      <BalanceCard availableBalance={availableBalance} accounts={accounts} />

      <hr className="border-line my-12" />

      <section>
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
          <p className="text-sm text-ink-3 text-center py-12">
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
    </main>
  )
}
