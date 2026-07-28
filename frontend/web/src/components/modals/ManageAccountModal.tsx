import { overlayClass, cardClass, titleClass } from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onDeactivate: () => void
  onDelete: () => void
}

export default function ManageAccountModal({ isOpen, onClose, onDeactivate, onDelete }: Props) {
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Leaving FinTrak?</h2>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">Deactivate</span> signs you out and hides your
          data. You can pick up where you left off by logging back in later.
        </p>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">Delete</span> permanently removes your account
          and all associated data — transactions, budgets, bills, and goals. This can't be undone.
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => {
              onClose()
              onDeactivate()
            }}
            className="w-full text-sm font-semibold text-ink border border-line-2 rounded-lg py-2.5 hover:border-ink-3 transition-colors"
          >
            Deactivate Account
          </button>
          <button
            onClick={() => {
              onClose()
              onDelete()
            }}
            className="w-full text-sm font-semibold text-white bg-bad rounded-lg py-2.5 hover:opacity-90 transition-opacity"
          >
            Delete Account
          </button>
          <button
            onClick={onClose}
            className="w-full text-sm font-semibold text-ink-2 py-1 hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
