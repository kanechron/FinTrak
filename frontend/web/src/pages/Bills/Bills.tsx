import { useEffect, useState, type ReactNode } from 'react'
import { getBills, getBillsHistory, deleteBill, type Bill, updateBill } from '../../api/bills'
import { formatAmount } from '../../utils/format'
import BillFormModal from '../../components/modals/BillFormModal'
import type { Transaction } from '../../api/transactions'
import BillRow from './BillRow'
import PendingBillRow from './PendingBillRow'
import { monthlyEquivalent } from './billHelpers'
import { useToast } from '../../hooks/ToastProvider'

function BillSection({
  title,
  items,
  renderItem,
}: {
  title: string
  items: Bill[]
  renderItem: (b: Bill) => ReactNode
}) {
  return (
    <section>
      <h2 className="font-medium text-ink mb-2">{title}</h2>
      {items.length === 0 ? (
        <div className="py-12 text-center text-ink-3 text-sm">No bills here yet.</div>
      ) : (
        <div>{items.map(renderItem)}</div>
      )}
    </section>
  )
}

export default function Bills() {
  const [acceptedBills, setAcceptedBills] = useState<Bill[]>([])
  const [pendingBills, setPendingBills] = useState<Bill[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [historyCache, setHistoryCache] = useState<Record<string, Transaction[]>>({})
  const toast = useToast()

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
      toast.success({ title: 'Bill deleted', content: '' })
    } catch {
      toast.error({ title: 'Failed to delete bill', content: 'Please try again.' })
    }
  }

  // Only one bill can be expanded at a time (a single expandedId, not a per-row flag).
  // History is fetched once per bill and cached for the rest of the page's lifetime,
  // so collapsing and re-expanding the same bill doesn't refetch.
  async function toggleExpand(billId: string) {
    if (expandedId === billId) {
      setExpandedId(null)
      return
    }
    setExpandedId(billId)
    if (!historyCache[billId]) {
      const txns = await getBillsHistory(billId)
      setHistoryCache((prev) => ({ ...prev, [billId]: txns }))
    }
  }

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8 space-y-6">
      <BillFormModal
        isOpen={addModalOpen || !!selectedBill}
        bill={selectedBill ?? undefined}
        onClose={() => {
          setAddModalOpen(false)
          setSelectedBill(null)
        }}
        onSuccess={() => {
          setAddModalOpen(false)
          setSelectedBill(null)
          fetchBills()
        }}
      />

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
        <BillSection
          title="My Bills"
          items={acceptedBills}
          renderItem={(b) => (
            <BillRow
              key={b.id}
              bill={b}
              isExpanded={expandedId === b.id}
              history={historyCache[b.id]}
              onToggleExpand={() => toggleExpand(b.id)}
              onEdit={() => setSelectedBill(b)}
              onDelete={() => handleDelete(b.id)}
            />
          )}
        />
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
              <PendingBillRow
                key={bill.id}
                bill={bill}
                onConfirm={async () => {
                  await updateBill(bill.id, { status: 'Accepted' })
                  fetchBills()
                }}
                onDeny={async () => {
                  await updateBill(bill.id, { status: 'Declined' })
                  fetchBills()
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
