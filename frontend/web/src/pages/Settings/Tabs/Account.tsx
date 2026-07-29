import { useEffect, useState } from 'react'
import { plaidApi, type PlaidItemSummary } from '../../../api/plaid'
import { overlayClass, cardClass, titleClass } from '../../../components/modals/modalTheme'
import { useToast } from '../../../hooks/ToastProvider'

export default function Account() {
  const [items, setItems] = useState<PlaidItemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUnlink, setPendingUnlink] = useState<PlaidItemSummary | null>(null)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    plaidApi
      .getItems()
      .then(setItems)
      .catch(() => setError('Could not load connected banks.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUnlink() {
    if (!pendingUnlink) return
    setUnlinking(true)
    setError(null)
    try {
      const institutionName = pendingUnlink.institutionName
      await plaidApi.unlink(pendingUnlink.id)
      setItems((prev) => prev.filter((i) => i.id !== pendingUnlink.id))
      setPendingUnlink(null)
      toast.success({ title: 'Bank unlinked', content: institutionName })
    } catch {
      toast.error({ title: 'Failed to unlink bank', content: 'Please try again.' })
    } finally {
      setUnlinking(false)
    }
  }

  return (
    <div>
      <p className="text-[13px] text-ink-3 mb-5">Manage your connected banks.</p>

      {loading && <p className="text-[13px] text-ink-3">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-[13px] text-ink-3">No banks connected.</p>
      )}

      {error && <p className="text-[12.5px] text-bad mb-3">{error}</p>}

      <div className="flex flex-col divide-y divide-line">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{item.institutionName}</p>
              <p className="text-[12px] text-ink-3">{item.status}</p>
            </div>
            <button
              onClick={() => setPendingUnlink(item)}
              className="text-[12.5px] font-semibold text-bad hover:bg-bad/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              Unlink
            </button>
          </div>
        ))}
      </div>

      {pendingUnlink && (
        <div className={overlayClass} onClick={() => !unlinking && setPendingUnlink(null)}>
          <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
            <h2 className={titleClass}>Unlink {pendingUnlink.institutionName}?</h2>
            <p className="text-sm text-ink-2">
              This removes the connection and its accounts from FinTrak. Existing transactions are
              kept. You can reconnect this bank later via Sync.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setPendingUnlink(null)}
                disabled={unlinking}
                className="flex-1 text-sm font-semibold text-ink-2 border border-line-2 rounded-lg py-2.5 hover:text-ink hover:border-ink-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="flex-1 text-sm font-semibold text-white bg-bad rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {unlinking ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
