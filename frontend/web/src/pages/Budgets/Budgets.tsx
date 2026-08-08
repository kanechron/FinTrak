import { useEffect, useState } from 'react'
import { getBudgets, type Budget } from '../../api/budgets'
import { getAccounts, type Account } from '../../api/accounts'
import BalanceCard from '../../components/common/BalanceCard'
import BudgetList from '../../components/common/BudgetList'
import BudgetFormModal from '../../components/modals/BudgetFormModal'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const fetchBudgets = () => getBudgets().then(setBudgets)
  const fetchAccounts = () => getAccounts().then(setAccounts)

  useEffect(() => {
    fetchBudgets()
    fetchAccounts()
  }, [])

  // Credit card / loan balances are negative (debt) and shouldn't reduce "available balance" —
  // only positive (asset) balances count toward this total.
  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)

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
        <BudgetList budgets={budgets} onBudgetChange={fetchBudgets} />
      </section>
    </main>
  )
}
