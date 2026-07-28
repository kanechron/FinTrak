import type { Bill } from '../../api/bills'
import type { Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import RowMenu from '../../components/common/RowMenu'
import { dueDateLabel, dueDateDiff, urgency, stripeClass, formatFrequency } from './billHelpers'

interface Props {
  bill: Bill
  isExpanded: boolean
  history: Transaction[] | undefined
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function BillRow({
  bill,
  isExpanded,
  history,
  onToggleExpand,
  onEdit,
  onDelete,
}: Props) {
  const diff = dueDateDiff(bill)
  const label = dueDateLabel(bill)
  const u = urgency(diff)

  return (
    <div className="border-t border-line first:border-t-0 pl-3.5 relative">
      <span
        className={`absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full ${stripeClass[u]}`}
      />
      <div className="py-4 pl-3 -mx-3 px-3 rounded-lg hover:bg-raised transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="text-ink font-semibold">{bill.displayName}</span>
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
                { label: isExpanded ? 'Hide History' : 'Show History', onClick: onToggleExpand },
                { label: 'Edit', onClick: onEdit },
                { label: 'Delete', onClick: onDelete, danger: true },
              ]}
            />
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-raised/40 rounded-lg mb-2 -mx-3">
          {!history ? (
            <p className="px-6 py-3 text-xs text-ink-3">Loading...</p>
          ) : history.length === 0 ? (
            <p className="px-6 py-3 text-xs text-ink-3">
              No matching transactions found — this bill may no longer be active.
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
                {history.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0 text-ink-2">
                    <td className="px-6 py-2 truncate" title={t.merchant}>
                      {t.merchant}
                    </td>
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
          {/* Reuses the same toggle as the kebab menu's "Hide History" — safe here since this
              button only renders while isExpanded is true, so it can only ever collapse. */}
          <button
            onClick={onToggleExpand}
            className="w-full text-center text-xs text-ink-3 hover:text-ink-2 border-t border-line py-2 transition-colors"
          >
            Hide
          </button>
        </div>
      )}
    </div>
  )
}
