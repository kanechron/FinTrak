import BalanceCard from '../../components/BalanceCard'
// import ProgressWidget from '../../components/ProgressWidget'
import RecentTransactions from '../../components/RecentTransactions'
import BudgetList from '../../components/BudgetList'
import GoalList from '../../components/GoalList'
import { useEffect, useState } from 'react'
import { getTransactions, type Transaction } from '../../api/transactions'
import { getAccounts, type Account } from '../../api/accounts'
import { getBudgets, type Budget } from '../../api/budgets'
import { getGoals, type Goal } from '../../api/goals'

export default function Dashboard() {

const [transactions, setTransactions] = useState<Transaction[]>([])
const [accounts, setAccounts] = useState<Account[]>([])
const [budgets, setBudgets] = useState<Budget[]>([])
const [goals, setGoals] = useState<Goal[]>([])

async function fetchData() {
  const [transactions, accounts, budgets, goals] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getBudgets(),
    getGoals()
  ])
  setTransactions(transactions)
  setAccounts(accounts)
  setBudgets(budgets)
  setGoals(goals)
}
useEffect(() => {
  fetchData()
}, [])



async function fetchGoals() {
  const goals = await getGoals()
  setGoals(goals)
}

const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-8">

      {/* Top row: Balance Card + Progress Widgets */}
      <section className="grid grid-cols-3 gap-4">
        <BalanceCard totalBalance={totalBalance} accounts={accounts} />
        <div className="col-span-2 flex flex-col gap-4">
          <GoalList goals={goals} onGoalAdded={fetchGoals}/>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-6">
        <RecentTransactions transactions={transactions} />
        <BudgetList budgets={budgets} /> 
        
      </div>

    </main>
  )
}
