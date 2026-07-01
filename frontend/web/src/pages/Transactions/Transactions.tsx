import { useEffect, useState } from 'react'
import { getTransactions, deleteTransaction, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import AddTransactionModal from '../../components/modals/AddTransactionModal'
import EditTransactionModal from '../../components/modals/EditTransactionModal'

const LIMIT = 30

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = () => getTransactions(0, LIMIT).then(t => {
    setTransactions(t)
    setOffset(LIMIT)
    setHasMore(t.length === LIMIT)
  }).catch(() => setError('Failed to load transactions.'))

  useEffect(() => {
    getTransactions(0, LIMIT)
      .then(t => {
        setTransactions(t)
        setOffset(LIMIT)
        setHasMore(t.length === LIMIT)
      })
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const more = await getTransactions(offset, LIMIT)
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id))
        return [...prev, ...more.filter(t => !existingIds.has(t.id))]
      })
      setOffset(prev => prev + LIMIT)
      setHasMore(more.length === LIMIT)
    } catch {
      setError('Failed to load more transactions.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <AddTransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />
      {selectedTransaction && (
        <EditTransactionModal
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onSuccess={() => { setSelectedTransaction(null); fetchTransactions() }}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <button onClick={() => setAddModalOpen(true)} className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer">
          + Add Transaction
        </button>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden h-[520px] overflow-y-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 font-normal">Merchant</th>
              <th className="text-left px-4 py-3 font-normal">Category</th>
              <th className="text-left px-4 py-3 font-normal">Date</th>
              <th className="text-right px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-600 text-sm">Loading...</td></tr>
            )}
            {error && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-red-500 text-sm">{error}</td></tr>
            )}
            {!loading && !error && transactions.map(t => (
              <tr
                key={t.id}
                className="text-gray-300 hover:bg-gray-900/40 transition-colors cursor-pointer group"
                onClick={() => setSelectedTransaction(t)}
              >
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
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load 30 more'}
          </button>
        </div>
      )}
    </main>
  )
}
