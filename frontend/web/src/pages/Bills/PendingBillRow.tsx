import type { Bill } from '../../api/bills'
import { formatAmount } from '../../utils/format'

interface Props {
  bill: Bill
  onConfirm: () => void
  onDeny: () => void
}

export default function PendingBillRow({ bill, onConfirm, onDeny }: Props) {
  return (
    <div className="border-t border-line first:border-t-0 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <span className="text-ink font-semibold text-sm">{bill.displayName}</span>
        {bill.category && <p className="text-xs text-ink-3 mt-0.5">{bill.category}</p>}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 text-sm">
        <span className="text-ink font-bold text-base tabular-nums">
          {formatAmount(-bill.amount)}
        </span>
        <button
          onClick={onConfirm}
          className="text-[11.5px] font-semibold text-good border border-good/45 rounded-full px-3.5 py-1.5 hover:bg-good/15 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={onDeny}
          className="text-[11.5px] font-semibold text-ink-3 border border-line-2 rounded-full px-3.5 py-1.5 hover:text-bad hover:border-bad/45 transition-colors"
        >
          Deny
        </button>
      </div>
    </div>
  )
}
