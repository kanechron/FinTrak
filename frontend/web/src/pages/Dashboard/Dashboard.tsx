import BalanceCard from '../../components/dashboard/BalanceCard'
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

  // Accounts exist but no transactions usually means the bank was just linked and the
  // initial historical sync hasn't run (or completed) yet — trigger it automatically
  // once on load rather than showing an empty dashboard until the user hits Sync manually.
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

  // Credit card / loan balances are negative (debt) and shouldn't reduce "available balance" —
  // only positive (asset) balances count toward this total.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
        <div className="order-2 md:order-1">
          <RecentTransactions transactions={transactions} />
        </div>
        <div className="order-1 pb-10 border-b border-line md:order-2 md:pb-0 md:pl-14 md:border-b-0 md:border-l">
          <BudgetList budgets={budgets} onBudgetChange={fetchBudgets}/>
        </div>
      </div>
    </main>
  )
}
