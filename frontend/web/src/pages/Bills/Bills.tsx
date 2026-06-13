import { useEffect, useState } from 'react'
import { getBills, getSuggestions, addBill, deleteBill, type Bill, type TransactionGroup } from '../../api/bills'
import { formatAmount } from '../../utils/format'
import AddBillModal from '../../components/modals/AddBillModal'
import EditBillModal from '../../components/modals/EditBillModal'

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

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [suggestions, setSuggestions] = useState<TransactionGroup[][]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchBills = () => getBills().then(setBills)

  useEffect(() => {
    fetchBills()
    getSuggestions().then(setSuggestions)
  }, [])

  const manualBills = bills.filter(b => !b.isAutoDetected)

  const monthlyTotal = bills.reduce((sum, b) => {
    switch (b.frequency) {
      case 'Weekly': return sum + b.amount * 4.33
      case 'BiWeekly': return sum + b.amount * 2.17
      case 'Monthly': return sum + b.amount
      case 'Quarterly': return sum + b.amount / 3
      case 'Yearly': return sum + b.amount / 12
      default: return sum + b.amount
    }
  }, 0)

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
                onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : bill.id) }}
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
          <div className="px-6 pb-4 text-xs text-gray-500 bg-gray-900/30">
            Transaction history coming soon.
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

      {/* Summary */}
      <section className="border border-red-900/40 bg-red-950/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Est. Monthly Total</p>
          <p className="text-3xl font-bold tracking-tight text-red-100">{formatAmount(-monthlyTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">{bills.length} bill{bills.length !== 1 ? 's' : ''} tracked</p>
        </div>
      </section>

      <BillSection title="Manual" items={manualBills} />

      {/* Auto-Detected Suggestions */}
      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-medium">Auto-Detected</h2>
          <p className="text-xs text-gray-500 mt-0.5">Recurring patterns found in your transactions</p>
        </div>
        {suggestions.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">No suggestions found.</div>
        ) : (
          <div>
            {suggestions.map((group, i) => {
              const s = group[0]
              const amount = s.amounts[0]
              return (
                <div key={i} className="border-b border-gray-800 last:border-0 px-5 py-4 flex items-center justify-between hover:bg-gray-900/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-gray-100 font-semibold text-sm">{s.merchantName}</span>
                    <div className="flex items-center gap-3">
                      {s.category && <p className="text-xs text-gray-500">{s.category}</p>}
                      <p className="text-xs text-gray-600">{s.count} occurrences</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-100 font-bold text-base">{amount != null ? formatAmount(-amount) : '—'}</span>
                    <button
                      onClick={async () => {
                        await addBill({ name: s.merchantName, amount: amount ?? 0, frequency: 'Monthly', dueDay: null, customDate: null, lastPaidDate: null, isAutoPay: false, categoryId: null })
                        fetchBills()
                        setSuggestions(prev => prev.filter((_, idx) => idx !== i))
                      }}
                      className="text-emerald-500 hover:text-emerald-400 transition-colors text-lg"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setSuggestions(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
