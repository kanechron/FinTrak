import { useEffect, useState } from 'react'
import { getBills, deleteBill, type Bill, updateBill } from '../../api/bills'
import { formatAmount } from '../../utils/format'
import AddBillModal from '../../components/modals/AddBillModal'
import EditBillModal from '../../components/modals/EditBillModal'
import { getTransactionsByCategory, type Transaction } from '../../api/transactions'

function dueDateLabel(bill: Bill): string {
  if (!bill.nextDueDate) return '—'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.nextDueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff}d`
}

function dueDateDiff(bill: Bill): number | null {
  if (!bill.nextDueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.nextDueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyStripe(diff: number | null): string {
  if (diff === null) return 'bg-gray-700'
  if (diff < 0) return 'bg-red-500'
  if (diff <= 7) return 'bg-yellow-400'
  return 'bg-gray-700'
}

function dueDateBadge(diff: number | null): string {
  if (diff === null) return 'bg-gray-800 text-gray-500'
  if (diff < 0) return 'bg-red-500/15 text-red-400 border border-red-500/30'
  if (diff <= 7) return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
  return 'bg-gray-800 text-gray-500'
}

function formatFrequency(f: string): string {
  switch (f) {
    case 'BiWeekly': return 'Bi-Weekly'
    default: return f
  }
}

function monthlyEquivalent(bill: Bill): number {
  switch (bill.frequency) {
    case 'Weekly': return bill.amount * 4.33
    case 'BiWeekly': return bill.amount * 2.17
    case 'Monthly': return bill.amount
    case 'Quarterly': return bill.amount / 3
    case 'Yearly': return bill.amount / 12
    default: return bill.amount
  }
}

export default function Bills() {
  const [acceptedBills, setAcceptedBills] = useState<Bill[]>([])
  const [pendingBills, setPendingBills] = useState<Bill[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [historyCache, setHistoryCache] = useState<Record<string, Transaction[]>>({})

  const fetchBills = () =>
    getBills().then(data => {
      setAcceptedBills(data.filter(b => b.status === 'Accepted'))
      setPendingBills(data.filter(b => b.status === 'Pending'))
    })

  useEffect(() => {
    fetchBills()
  }, [])

  const monthlyTotal = acceptedBills.reduce((sum, b) => sum + monthlyEquivalent(b), 0)

  async function handleDelete(id: string) {
    try {
      await deleteBill(id)
      fetchBills()
    } catch {
      console.error('Failed to delete bill')
    }
  }

  function BillRow({ bill }: { bill: Bill }) {
    const isExpanded = expandedId === bill.id
    const diff = dueDateDiff(bill)
    const label = dueDateLabel(bill)
    return (
      <div className="border-b border-gray-800 last:border-0">
        <div
          className="flex items-stretch hover:bg-gray-900/40 transition-colors cursor-pointer"
          onClick={() => setSelectedBill(bill)}
        >
          <div className={`w-1 shrink-0 ${urgencyStripe(diff)}`} />
          <div className="flex-1 px-5 py-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-100 font-semibold">{bill.name}</span>
                {bill.isAutoPay && (
                  <span className="text-xs text-blue-400 border border-blue-800 rounded px-1.5 py-0.5">Auto-pay</span>
                )}
                {bill.isAutoDetected && (
                  <span className="text-xs text-purple-400 border border-purple-800 rounded px-1.5 py-0.5">Detected</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {bill.category && <p className="text-xs text-gray-500">{bill.category}</p>}
                <p className="text-xs text-gray-600">{formatFrequency(bill.frequency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={`text-xs px-2 py-0.5 rounded-full ${dueDateBadge(diff)}`}>{label}</span>
              <span className="text-gray-100 font-bold text-base">{formatAmount(-bill.amount)}</span>
              <button
                onClick={async e => {
                  e.stopPropagation()
                  if (isExpanded) { setExpandedId(null); return }
                  setExpandedId(bill.id)
                  if (bill.categoryId && !historyCache[bill.id]) {
                    const txns = await getTransactionsByCategory(bill.categoryId)
                    setHistoryCache(prev => ({ ...prev, [bill.id]: txns }))
                  }
                }}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                {isExpanded ? '▲' : '▼'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(bill.id) }}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="bg-gray-900/30 border-t border-gray-800/50">
            {!bill.categoryId ? (
              <p className="px-6 py-3 text-xs text-gray-600">No category assigned — can't load history.</p>
            ) : !historyCache[bill.id] ? (
              <p className="px-6 py-3 text-xs text-gray-600">Loading...</p>
            ) : historyCache[bill.id].length === 0 ? (
              <p className="px-6 py-3 text-xs text-gray-600">No transactions found for this category.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 border-b border-gray-800/50">
                    <th className="text-left px-6 py-2 font-normal">Merchant</th>
                    <th className="text-left px-6 py-2 font-normal">Date</th>
                    <th className="text-right px-6 py-2 font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {historyCache[bill.id].map(t => (
                    <tr key={t.id} className="border-b border-gray-800/30 last:border-0 text-gray-400">
                      <td className="px-6 py-2">{t.merchant}</td>
                      <td className="px-6 py-2 text-gray-500">{t.date}</td>
                      <td className={`px-6 py-2 text-right font-mono ${t.amount < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatAmount(-t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    )
  }

  function BillSection({ title, items }: { title: string; items: Bill[] }) {
    return (
      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-medium">{title}</h2>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">No bills here yet.</div>
        ) : (
          <div>
            {items.map(b => <BillRow key={b.id} bill={b} />)}
          </div>
        )}
      </section>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <AddBillModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchBills} />
      {selectedBill && (
        <EditBillModal
          bill={selectedBill}
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => { setSelectedBill(null); fetchBills() }}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bills</h1>
        <button onClick={() => setAddModalOpen(true)} className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer">
          + Add Bill
        </button>
      </div>

      <section className="border border-red-900/40 bg-red-950/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Est. Monthly Total</p>
          <p className="text-3xl font-bold tracking-tight text-red-100">{formatAmount(-monthlyTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">{acceptedBills.length} bill{acceptedBills.length !== 1 ? 's' : ''} tracked</p>
        </div>
      </section>

      <BillSection title="My Bills" items={acceptedBills} />

      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-medium">Auto-Detected</h2>
          <p className="text-xs text-gray-500 mt-0.5">Recurring patterns found in your transactions</p>
        </div>
        {pendingBills.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">No suggestions found.</div>
        ) : (
          <div>
            {pendingBills.map(bill => (
              <div key={bill.id} className="border-b border-gray-800 last:border-0 px-5 py-4 flex items-center justify-between hover:bg-gray-900/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-gray-100 font-semibold text-sm">{bill.name}</span>
                  <div className="flex items-center gap-3">
                    {bill.category && <p className="text-xs text-gray-500">{bill.category}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-100 font-bold text-base">{formatAmount(-bill.amount)}</span>
                  <button
                    onClick={async () => {
                      await updateBill(bill.id, { status: 'Accepted' })
                      fetchBills()
                    }}
                    className="text-emerald-500 hover:text-emerald-400 transition-colors text-lg"
                  >
                    ✓
                  </button>
                  <button
                    onClick={async () => {
                      await updateBill(bill.id, { status: 'Declined' })
                      fetchBills()
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
