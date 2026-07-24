import { useState } from 'react'
import { formatAmount } from '../../utils/format'
import { truncate } from '../../utils/truncate'

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  pending: boolean
}

interface Props {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: Props) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? transactions : transactions.slice(0, 10)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-ink">Recent Transactions</h2>
        {transactions.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-ink-3 hover:text-ink-2 transition-colors"
          >
            {expanded ? 'Show less' : 'View more'}
          </button>
        )}
      </div>
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-[58%]" />
          <col className="w-[18%]" />
          <col className="w-[24%]" />
        </colgroup>
        <thead>
          <tr className="text-xs text-ink-3 border-b border-line">
            <th className="text-left pb-2 font-normal">Merchant</th>
            <th className="text-left pb-2 font-normal">Date</th>
            <th className="text-right pb-2 font-normal">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {visible.map((t) => (
            <tr key={t.id} className="text-ink-2">
              <td className="py-2.5 text-ink font-medium max-w-0">
                <span className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom" title={t.merchant}>
                  {truncate(t.merchant, 22)}
                </span>
                {t.pending && <span className="ml-2 text-xs text-warn">Pending</span>}
              </td>
              <td className="py-2.5 text-ink-3">{t.date}</td>
              {/* Plaid stores debits as positive and credits as negative.
                  Negate for display so debits show red and credits show green. */}
              <td
                className={`py-2.5 text-right font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
              >
                {formatAmount(-t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
