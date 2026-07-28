import { useEffect, useState } from 'react'
import { getBudgets, deleteBudget, type Budget } from '../../api/budgets'
import { getAccounts, type Account } from '../../api/accounts'
import BalanceCard from '../../components/dashboard/BalanceCard'
import BudgetCard from '../../components/dashboard/BudgetCard'
import BudgetFormModal from '../../components/modals/BudgetFormModal'

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

  // Credit card / loan balances are negative (debt) and shouldn't reduce "available balance" —
  // only positive (asset) balances count toward this total.
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
          fetchBudgets()
        }}
      />

      <BalanceCard availableBalance={availableBalance} accounts={accounts} />

      <hr className="border-line my-12" />

      <section>
        <h2 className="font-medium text-ink mb-4">Budgets</h2>
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
        <button
          onClick={() => setAddModalOpen(true)}
          className="w-full text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity mt-5 pt-4 border-t border-line"
        >
          + Add Budget
        </button>
      </section>
    </main>
  )
}
