import { useEffect, useState } from 'react'
import { getTransactions, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    getTransactions().then(setTransactions)
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden h-[520px] overflow-y-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 font-normal">Merchant</th>
              <th className="text-left px-4 py-3 font-normal">Category</th>
              <th className="text-left px-4 py-3 font-normal">Date</th>
              <th className="text-right px-4 py-3 font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {transactions.map(t => (
              <tr key={t.id} className="text-gray-300 hover:bg-gray-900/40 transition-colors">
                <td className="px-4 py-3">
                  {t.merchant}
                  {t.pending && <span className="ml-2 text-xs text-yellow-500">Pending</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{t.category}</td>
                <td className="px-4 py-3 text-gray-500">{t.date}</td>
                {/* Plaid stores debits as positive — negate for display so debits are red, credits green */}
                <td className={`px-4 py-3 text-right font-mono ${t.amount < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatAmount(-t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
