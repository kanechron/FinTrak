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

function formatAmount(amount: number) {
  const abs = Math.abs(amount).toFixed(2)
  return amount < 0 ? `-$${abs}` : `+$${abs}`
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-emerald-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Dashboard() {
  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-8">

      {/* Top row: Balance Card + Progress Widgets */}
      <section className="grid grid-cols-3 gap-4">

        {/* Balance Card */}
        <div className="col-span-1 border border-gray-800 rounded-xl p-8 flex flex-col justify-start">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Balance</p>
          <p className="text-5xl font-bold tracking-tight">$18,580.55</p>
          <p className="text-sm text-gray-500 mt-2">across 4 accounts</p>
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
            {FAKE_ACCOUNTS.map((a) => (
              <div key={a.last4} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">{a.name}</p>
                  <p className={`text-sm font-medium ${a.balance < 0 ? 'text-red-400' : ''}`}>
                    {formatAmount(a.balance)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{a.type} · {a.last4}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Widgets */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Spent This Month */}
          <div className="border border-gray-800 rounded-xl p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Spent This Month</p>
              <p className="text-xs text-gray-500">62%</p>
            </div>
            <p className="text-2xl font-semibold">$1,243.18</p>
            <ProgressBar value={1243.18} max={2000} />
            <p className="text-xs text-gray-500">$756.82 remaining of $2,000 budget</p>
          </div>

          {/* Savings Goal */}
          <div className="border border-gray-800 rounded-xl p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Savings Goal</p>
              <p className="text-xs text-gray-500">64%</p>
            </div>
            <p className="text-2xl font-semibold">$3,200.00</p>
            <ProgressBar value={3200} max={5000} />
            <p className="text-xs text-gray-500">$1,800.00 remaining of $5,000 target</p>
          </div>

          {/* Joint Account */}
          <div className="border border-gray-800 rounded-xl p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Joint Account</p>
              <p className="text-xs text-gray-500">61%</p>
            </div>
            <p className="text-2xl font-semibold">$6,100.00</p>
            <ProgressBar value={6100} max={10000} />
            <p className="text-xs text-gray-500">$3,900.00 remaining of $10,000 target</p>
          </div>

        </div>
      </section>

      <div className="grid grid-cols-5 gap-6">

        {/* Recent transactions */}
        <section className="col-span-3 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent Transactions</h2>
            <button className="text-xs text-gray-500 hover:text-gray-300">View all</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-normal">Merchant</th>
                <th className="text-left pb-2 font-normal">Category</th>
                <th className="text-left pb-2 font-normal">Date</th>
                <th className="text-right pb-2 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {FAKE_TRANSACTIONS.map((t) => (
                <tr key={t.id} className="text-gray-300">
                  <td className="py-2.5">
                    {t.merchant}
                    {t.pending && <span className="ml-2 text-xs text-yellow-500">Pending</span>}
                  </td>
                  <td className="py-2.5 text-gray-500">{t.category}</td>
                  <td className="py-2.5 text-gray-500">{t.date}</td>
                  <td className={`py-2.5 text-right font-mono ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatAmount(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Budgets */}
        <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="font-medium">Budgets</h2>
          <div className="space-y-4">
            {FAKE_BUDGETS.map((b) => (
              <div key={b.category} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{b.category}</span>
                  <span className="text-gray-500">${b.spent} / ${b.limit}</span>
                </div>
                <ProgressBar value={b.spent} max={b.limit} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
