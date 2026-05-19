import BalanceCard from '../../components/BalanceCard'
import ProgressWidget from '../../components/ProgressWidget'
import RecentTransactions from '../../components/RecentTransactions'
import BudgetList from '../../components/BudgetList'

const FAKE_TRANSACTIONS = [
  { id: '1', date: '2026-05-09', merchant: 'Whole Foods', amount: -84.32, category: 'Groceries', pending: false },
  { id: '2', date: '2026-05-09', merchant: 'Netflix', amount: -15.99, category: 'Subscriptions', pending: false },
  { id: '3', date: '2026-05-08', merchant: 'Shell', amount: -62.10, category: 'Gas', pending: false },
  { id: '4', date: '2026-05-08', merchant: 'Direct Deposit', amount: 2840.00, category: 'Income', pending: false },
  { id: '5', date: '2026-05-07', merchant: 'Chipotle', amount: -13.45, category: 'Dining', pending: true },
  { id: '6', date: '2026-05-07', merchant: 'Amazon', amount: -39.99, category: 'Shopping', pending: false },
  { id: '7', date: '2026-05-06', merchant: 'Spotify', amount: -9.99, category: 'Subscriptions', pending: false },
  { id: '8', date: '2026-05-05', merchant: 'Starbucks', amount: -6.75, category: 'Dining', pending: false },
]

const FAKE_ACCOUNTS = [
  { name: "James's Checking", type: 'Checking', last4: '4821', balance: 10240.10 },
  { name: "James's Savings", type: 'Savings', last4: '3390', balance: 3200.00 },
  { name: "James's Credit Card", type: 'Credit', last4: '7714', balance: -959.55 },
  { name: 'Joint Account', type: 'Savings', last4: '2256', balance: 6100.00 },
]

const FAKE_BUDGETS = [
  { category: 'Groceries', spent: 284, limit: 400 },
  { category: 'Dining', spent: 127, limit: 150 },
  { category: 'Gas', spent: 62, limit: 120 },
  { category: 'Subscriptions', spent: 46, limit: 60 },
  { category: 'Shopping', spent: 39, limit: 200 },
]

const totalBalance = FAKE_ACCOUNTS.reduce((sum, a) => sum + a.balance, 0)

export default function Dashboard() {
  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-8">

      {/* Top row: Balance Card + Progress Widgets */}
      <section className="grid grid-cols-3 gap-4">
        <BalanceCard totalBalance={totalBalance} accounts={FAKE_ACCOUNTS} />
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
        <RecentTransactions transactions={FAKE_TRANSACTIONS} />
        <BudgetList budgets={FAKE_BUDGETS} />
      </div>

    </main>
  )
}
