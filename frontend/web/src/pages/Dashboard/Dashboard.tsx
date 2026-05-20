import BalanceCard from '../../components/BalanceCard'
import ProgressWidget from '../../components/ProgressWidget'
import RecentTransactions from '../../components/RecentTransactions'
import BudgetList from '../../components/BudgetList'
import { useEffect, useState } from 'react'
import { getTransactions, type Transaction } from '../../api/transactions'
import { getAccounts, type Account } from '../../api/accounts'
import { getBudgets, type Budget } from '../../api/budgets'

export default function Dashboard() {

const [transactions, setTransactions] = useState<Transaction[]>([])
const [accounts, setAccounts] = useState<Account[]>([])
const [budgets, setBudgets] = useState<Budget[]>([])

async function fetchData() {
  const [transactions, accounts, budgets] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getBudgets(),
  ])
  setTransactions(transactions)
  setAccounts(accounts)
  setBudgets(budgets)
}
useEffect(() => {
  fetchData()
}, [])

const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-8">

      {/* Top row: Balance Card + Progress Widgets */}
      <section className="grid grid-cols-3 gap-4">
        <BalanceCard totalBalance={totalBalance} accounts={accounts} />
        <div className="col-span-2 flex flex-col gap-4">
          <ProgressWidget
            label="Spent This Month"
            value={1243.18}
            max={2000}
            subtext="$756.82 remaining of $2,000 budget"
          />
          <ProgressWidget
            label="Savings Goal"
            value={3200}
            max={5000}
            subtext="$1,800.00 remaining of $5,000 target"
          />
          <ProgressWidget
            label="Joint Account"
            value={6100}
            max={10000}
            subtext="$3,900.00 remaining of $10,000 target"
          />
        </div>
      </section>

      <div className="grid grid-cols-5 gap-6">
        <RecentTransactions transactions={transactions} />
        <BudgetList budgets={budgets} />
      </div>

    </main>
  )
}
