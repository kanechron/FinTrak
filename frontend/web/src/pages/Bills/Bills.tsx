import { useEffect, useState } from 'react'
import { getBills, deleteBill, type Bill, updateBill } from '../../api/bills'
import { formatAmount } from '../../utils/format'
import AddBillModal from '../../components/modals/AddBillModal'
import EditBillModal from '../../components/modals/EditBillModal'
import { getTransactionsByCategory, type Transaction } from '../../api/transactions'
import RowMenu from '../../components/common/RowMenu'

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

type Urgency = 'overdue' | 'soon' | 'normal'

function urgency(diff: number | null): Urgency {
  if (diff === null) return 'normal'
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'soon'
  return 'normal'
}

const stripeClass: Record<Urgency, string> = {
  overdue: 'bg-bad',
  soon: 'bg-warn',
  normal: 'bg-transparent',
}

function formatFrequency(f: string): string {
  switch (f) {
    case 'BiWeekly':
      return 'Bi-Weekly'
    default:
      return f
  }
}

function monthlyEquivalent(bill: Bill): number {
  switch (bill.frequency) {
    case 'Weekly':
      return bill.amount * 4.33
    case 'BiWeekly':
      return bill.amount * 2.17
    case 'Monthly':
      return bill.amount
    case 'Quarterly':
      return bill.amount / 3
    case 'Yearly':
      return bill.amount / 12
    default:
      return bill.amount
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
    getBills().then((data) => {
      setAcceptedBills(data.filter((b) => b.status === 'Accepted'))
      setPendingBills(data.filter((b) => b.status === 'Pending'))
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
    const u = urgency(diff)

    async function toggleExpanded() {
      if (isExpanded) {
        setExpandedId(null)
        return
      }
      setExpandedId(bill.id)
      if (bill.categoryId && !historyCache[bill.id]) {
        const txns = await getTransactionsByCategory(bill.categoryId)
        setHistoryCache((prev) => ({ ...prev, [bill.id]: txns }))
      }
    }

    return (
      <div className="border-t border-line first:border-t-0 pl-3.5 relative">
        <span className={`absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full ${stripeClass[u]}`} />
        <div className="py-4 pl-3 -mx-3 px-3 rounded-lg hover:bg-raised transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="text-ink font-semibold">{bill.name}</span>
                {bill.isAutoPay && (
                  <span className="text-[10px] font-semibold text-s1 border border-s1/40 rounded px-1.5 py-0.5">
                    Auto-pay
                  </span>
                )}
                {bill.isAutoDetected && (
                  <span className="text-[10px] font-semibold text-s5 border border-s5/40 rounded px-1.5 py-0.5">
                    Detected
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-3">
                {formatFrequency(bill.frequency)} · {label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink font-bold text-base tabular-nums">
                {formatAmount(-bill.amount)}
              </span>
              <RowMenu
                ariaLabel="Bill options"
                actions={[
                  { label: isExpanded ? 'Hide History' : 'Show History', onClick: toggleExpanded },
                  { label: 'Edit', onClick: () => setSelectedBill(bill) },
                  { label: 'Delete', onClick: () => handleDelete(bill.id), danger: true },
                ]}
              />
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="bg-raised/40 rounded-lg mb-2 -mx-3">
            {!bill.categoryId ? (
              <p className="px-6 py-3 text-xs text-ink-3">
                No category assigned — can't load history.
              </p>
            ) : !historyCache[bill.id] ? (
              <p className="px-6 py-3 text-xs text-ink-3">Loading...</p>
            ) : historyCache[bill.id].length === 0 ? (
              <p className="px-6 py-3 text-xs text-ink-3">
                No transactions found for this category.
              </p>
            ) : (
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="text-ink-3 border-b border-line">
                    <th className="text-left px-6 py-2 font-normal w-1/2">Merchant</th>
                    <th className="text-left px-6 py-2 font-normal w-1/4">Date</th>
                    <th className="text-right px-6 py-2 font-normal w-1/4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {historyCache[bill.id].map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-0 text-ink-2">
                      <td className="px-6 py-2 truncate" title={t.merchant}>{t.merchant}</td>
                      <td className="px-6 py-2 text-ink-3">{t.date}</td>
                      <td
                        className={`px-6 py-2 text-right font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
                      >
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
      <section>
        <h2 className="font-medium text-ink mb-2">{title}</h2>
        {items.length === 0 ? (
          <div className="py-12 text-center text-ink-3 text-sm">No bills here yet.</div>
        ) : (
          <div>
            {items.map((b) => (
              <BillRow key={b.id} bill={b} />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8 space-y-6">
      <AddBillModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchBills}
      />
      {selectedBill && (
        <EditBillModal
          bill={selectedBill}
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => {
            setSelectedBill(null)
            fetchBills()
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Bills</h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity"
        >
          + Add Bill
        </button>
      </div>

      <section className="rounded-xl bg-bad/[0.08] px-6 py-5">
        <p className="text-[11px] uppercase tracking-wider text-bad/80 mb-1">Est. Monthly Total</p>
        <p className="text-4xl font-bold tracking-tight text-bad">{formatAmount(-monthlyTotal)}</p>
        <p className="text-sm text-ink-3 mt-1">
          {acceptedBills.length} bill{acceptedBills.length !== 1 ? 's' : ''} tracked
        </p>
      </section>

      <div className="pt-4">
        <BillSection title="My Bills" items={acceptedBills} />
      </div>

      <hr className="border-line" />

      <section>
        <h2 className="font-medium text-ink mb-0.5">Auto-Detected</h2>
        <p className="text-xs text-ink-3 mb-2">Recurring patterns found in your transactions</p>
        {pendingBills.length === 0 ? (
          <div className="py-12 text-center text-ink-3 text-sm">No suggestions found.</div>
        ) : (
          <div>
            {pendingBills.map((bill) => (
              <div
                key={bill.id}
                className="border-t border-line first:border-t-0 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="text-ink font-semibold text-sm">{bill.name}</span>
                  {bill.category && <p className="text-xs text-ink-3 mt-0.5">{bill.category}</p>}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 text-sm">
                  <span className="text-ink font-bold text-base tabular-nums">
                    {formatAmount(-bill.amount)}
                  </span>
                  <button
                    onClick={async () => {
                      await updateBill(bill.id, { status: 'Accepted' })
                      fetchBills()
                    }}
                    className="text-[11.5px] font-semibold text-good border border-good/45 rounded-full px-3.5 py-1.5 hover:bg-good/15 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={async () => {
                      await updateBill(bill.id, { status: 'Declined' })
                      fetchBills()
                    }}
                    className="text-[11.5px] font-semibold text-ink-3 border border-line-2 rounded-full px-3.5 py-1.5 hover:text-bad hover:border-bad/45 transition-colors"
                  >
                    Deny
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
