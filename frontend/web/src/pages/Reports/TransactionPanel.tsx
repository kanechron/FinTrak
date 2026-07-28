import { useState, useMemo, useEffect } from 'react'
import { type Transaction } from '../../api/transactions'
import { formatAmount, formatCategoryName } from '../../utils/format'

interface Props {
  clickedCategory: { id: string; name: string } | null
  transactions: Transaction[]
  onClose: () => void
}

export default function TransactionPanel({ clickedCategory, transactions, onClose }: Props) {
  const [sortField, setSortField] = useState<'amount' | 'name' | 'date'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [panelSearch, setPanelSearch] = useState('')

  // Month/cash-flow clicks use the 'month'/'cashflow' sentinel ids (not a real category id) and
  // default to sorting by date; category slice clicks default to sorting by amount.
  useEffect(() => {
    if (!clickedCategory) return
    setPanelSearch('')
    setSortField(
      clickedCategory.id === 'month' || clickedCategory.id === 'cashflow' ? 'date' : 'amount'
    )
    setSortDir('desc')
  }, [clickedCategory?.id])

  const sortedTransactions = useMemo(() => {
    let list = transactions.filter((t) =>
      t.merchant.toLowerCase().includes(panelSearch.toLowerCase())
    )
    list = [...list].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDir === 'asc'
          ? Math.abs(a.amount) - Math.abs(b.amount)
          : Math.abs(b.amount) - Math.abs(a.amount)
      }
      if (sortField === 'date') {
        return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
      }
      return sortDir === 'asc'
        ? a.merchant.localeCompare(b.merchant)
        : b.merchant.localeCompare(a.merchant)
    })
    return list
  }, [transactions, sortField, sortDir, panelSearch])

  return (
    <div
      className={`${clickedCategory ? 'fixed inset-0 h-dvh z-[10000] flex' : 'hidden'} sm:flex sm:static sm:h-auto sm:z-auto flex-col overflow-hidden bg-page sm:flex-none sm:border-l sm:border-line transition-all duration-300 ${
        clickedCategory ? 'sm:w-[420px]' : 'sm:w-0'
      }`}
    >
      {clickedCategory && (
        <>
          {/* Panel header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-line">
            <div>
              <h2 className="font-medium text-ink">{formatCategoryName(clickedCategory.name)}</h2>
              <p className="text-xs text-ink-3 mt-0.5">{sortedTransactions.length} transactions</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-2 text-lg hover:bg-raised transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Panel filters */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
            <input
              type="text"
              placeholder="Search..."
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              className="text-xs bg-transparent border border-line rounded-lg px-3 py-1 text-ink-2 placeholder-ink-3 focus:outline-none focus:border-line-2 w-full"
            />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'amount' | 'name' | 'date')}
              className="text-xs bg-card border border-line rounded-lg px-2 py-1 text-ink-2 focus:outline-none focus:border-line-2 shrink-0"
            >
              <option value="amount">Amount</option>
              <option value="name">Name</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="text-xs text-ink-3 hover:text-ink-2 border border-line rounded-lg px-2 py-1 shrink-0 transition-colors"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {/* Transaction list */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[25%]" />
                <col className="w-[25%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-page">
                <tr className="text-xs text-ink-3 border-b border-line">
                  <th className="text-left px-5 py-3 font-normal">Merchant</th>
                  <th className="text-left px-5 py-3 font-normal">Date</th>
                  <th className="text-right px-5 py-3 font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedTransactions.map((t) => (
                  <tr key={t.id} className="text-ink-2 hover:bg-raised/40 transition-colors">
                    <td className="px-5 py-3 max-w-0">
                      <span
                        className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom"
                        title={t.merchant}
                      >
                        {t.merchant}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-3">{t.date}</td>
                    <td
                      className={`px-5 py-3 text-right font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
                    >
                      {formatAmount(-t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
