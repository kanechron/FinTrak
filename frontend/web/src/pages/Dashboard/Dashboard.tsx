import BalanceCard from '../../components/dashboard/BalanceCard'
// import ProgressWidget from '../../components/dashboard/ProgressWidget'
import RecentTransactions from '../../components/dashboard/RecentTransactions'
import BudgetList from '../../components/dashboard/BudgetList'
import GoalList from '../../components/dashboard/GoalList'
import Welcome from '../Welcome/Welcome'
import { useEffect, useState } from 'react'
import { getTransactions, type Transaction } from '../../api/transactions'
import { getAccounts, type Account } from '../../api/accounts'
import { getBudgets, type Budget } from '../../api/budgets'
import { getGoals, type Goal } from '../../api/goals'
import allocateGoalAmounts from '../../utils/AllocateGoalAmounts'

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [allocatedGoals, setAllocatedGoals] = useState<Goal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function fetchData() {
    try {
      const [transactions, accounts, budgets, goals] = await Promise.all([
        getTransactions(),
        getAccounts(),
        getBudgets(),
        getGoals(),
      ])
      setTransactions(transactions)
      setAccounts(accounts)
      setBudgets(budgets)
      setAllocatedGoals(allocateGoalAmounts(goals, accounts))
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (accounts.length > 0 && transactions.length === 0) {
      fetch('/api/plaid/sync', { method: 'POST', credentials: 'include' })
        .then(() => fetchData())
        .catch(() => {})
    }
  }, [loaded])

  async function fetchGoals() {
    const [goals, accs] = await Promise.all([getGoals(), getAccounts()])
    setAllocatedGoals(allocateGoalAmounts(goals, accs))
  }

  async function fetchBudgets() {
    const budgets = await getBudgets()
    setBudgets(budgets)
  }

  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)
  if (error)
    return (
      <main className="max-w-[76rem] mx-auto px-3 py-8">
        <p className="text-bad text-sm">{error}</p>
      </main>
    )
  if (loaded && accounts.length === 0) return <Welcome />
  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <BalanceCard availableBalance={availableBalance} accounts={accounts} />

      <hr className="border-line my-12" />

      <GoalList goals={allocatedGoals} onGoalAdded={fetchGoals} accounts={accounts} />

      <hr className="border-line my-12" />

      <div className="grid grid-cols-2 gap-14">
        <RecentTransactions transactions={transactions} />
        <div className="pl-14 border-l border-line">
          <BudgetList budgets={budgets} onBudgetAdded={fetchBudgets} />
        </div>
      </div>
    </main>
  )
}
