import { useState } from 'react'
import { formatAmount } from '../../utils/format'

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  pending: boolean
}

interface Props {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: Props) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? transactions : transactions.slice(0, 10)

  return (
    <section className="col-span-3 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Recent Transactions</h2>
        {transactions.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            {expanded ? 'Show less' : 'View all'}
          </button>
        )}
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
          {visible.map((t) => (
            <tr key={t.id} className="text-gray-300">
              <td className="py-2.5">
                {t.merchant}
                {t.pending && <span className="ml-2 text-xs text-yellow-500">Pending</span>}
              </td>
              <td className="py-2.5 text-gray-500">{t.category}</td>
              <td className="py-2.5 text-gray-500">{t.date}</td>
              {/* Plaid stores debits as positive and credits as negative.
                  Negate for display so debits show red and credits show green. */}
              <td className={`py-2.5 text-right font-mono ${t.amount < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatAmount(-t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
