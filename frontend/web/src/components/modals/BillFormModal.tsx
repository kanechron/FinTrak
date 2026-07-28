import { useState, useEffect } from 'react'
import { addBill, updateBill, type Bill } from '../../api/bills'
import { getCategories, type Category } from '../../api/categories'
import { getTransactions, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import {
  overlayClass,
  cardClass,
  titleClass,
  labelClass,
  errorClass,
  inputClass,
  primaryButtonClass,
  toggleTrackClass,
  toggleThumbClass,
} from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bill?: Bill
}

export default function BillFormModal({ isOpen, onClose, onSuccess, bill }: Props) {
  const isEdit = !!bill

  const [name, setName] = useState(bill?.name ?? '')
  const [displayName, setDisplayName] = useState(bill?.displayName ?? '')
  const [amount, setAmount] = useState<number | null>(bill?.amount ?? null)
  const [frequency, setFrequency] = useState(bill?.frequency ?? 'Monthly')
  const [dueDay, setDueDay] = useState<number | null>(bill?.dueDay ?? null)
  const [customDate, setCustomDate] = useState(bill?.customDate ?? '')
  const [isAutoPay, setIsAutoPay] = useState(bill?.isAutoPay ?? false)
  const [categoryId, setCategoryId] = useState<string | null>(bill?.categoryId ?? null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add-mode-only: transaction search/picker state. Edit mode edits `name` directly instead.
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [matchedTransaction, setMatchedTransaction] = useState<Transaction | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')

  useEffect(() => {
    if (!isOpen) return
    getCategories()
      .then(setCategories)
      .catch(() => {})
    if (!isEdit)
      getTransactions()
        .then(setTransactions)
        .catch(() => {})
  }, [isOpen, isEdit])

  // Resync fields every time the modal opens, so closing without saving never leaves
  // stale text for the next open — whether that's a fresh Add or reopening the same Edit.
  useEffect(() => {
    if (!isOpen) return
    if (bill) {
      setName(bill.name)
      setDisplayName(bill.displayName)
      setAmount(bill.amount)
      setFrequency(bill.frequency)
      setDueDay(bill.dueDay)
      setCustomDate(bill.customDate ?? '')
      setIsAutoPay(bill.isAutoPay)
      setCategoryId(bill.categoryId)
    } else {
      setName('')
      setDisplayName('')
      setAmount(null)
      setFrequency('Monthly')
      setDueDay(null)
      setCustomDate('')
      setIsAutoPay(false)
      setCategoryId(null)
      setSearchQuery('')
      setMatchedTransaction(null)
      setManualMode(false)
      setManualName('')
    }
    setError(null)
  }, [isOpen, bill])

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  const showDueDay = ['Monthly', 'Quarterly', 'Yearly'].includes(frequency)
  const showCustomDate = frequency === 'Custom'

  const searchResults =
    !matchedTransaction && searchQuery.trim().length > 0
      ? transactions
          .filter((t) => t.merchant.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          .slice(0, 8)
      : []

  function selectTransaction(t: Transaction) {
    setMatchedTransaction(t)
    setSearchQuery('')
    setAmount(Math.abs(t.amount))
  }

  function clearMatch() {
    setMatchedTransaction(null)
    setSearchQuery('')
  }

  const matchName = isEdit
    ? name
    : manualMode
      ? manualName.trim()
      : (matchedTransaction?.merchant ?? '')

  async function handleSubmit() {
    if (!displayName.trim()) {
      setError('A display name is required.')
      return
    }
    if (!matchName) {
      setError(
        isEdit
          ? 'A matching name is required.'
          : manualMode
            ? 'Enter a merchant name to match transactions against.'
            : 'Select a transaction to match this bill against, or enter one manually.'
      )
      return
    }
    if (!amount || amount <= 0) {
      setError('Amount is required.')
      return
    }
    if (showDueDay && !dueDay) {
      setError('Due day is required for this frequency.')
      return
    }
    if (showCustomDate && !customDate) {
      setError('Custom date is required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await updateBill(bill.id, {
          name: matchName,
          displayName: displayName.trim(),
          amount,
          frequency,
          dueDay: showDueDay ? dueDay : null,
          customDate: showCustomDate ? customDate : null,
          isAutoPay,
          categoryId,
        })
      } else {
        await addBill({
          name: matchName,
          displayName: displayName.trim(),
          amount,
          frequency,
          dueDay: showDueDay ? dueDay : null,
          customDate: showCustomDate ? customDate : null,
          lastPaidDate: null,
          isAutoPay,
          categoryId,
        })
      }
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save bill.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className={titleClass}>{isEdit ? 'Edit Bill' : 'Add Bill'}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-3 hover:text-ink transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            type="text"
            placeholder="e.g. Rent"
            className={inputClass}
          />
        </div>

        {isEdit ? (
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Match Transaction Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Merchant name as it appears on your bank statement"
              className={inputClass}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Match Transaction</label>
              <button
                type="button"
                onClick={() => {
                  setManualMode((m) => !m)
                  clearMatch()
                }}
                className="text-xs text-ink-3 hover:text-ink-2 underline decoration-dotted underline-offset-2 transition-colors"
              >
                {manualMode ? 'Search transactions instead' : "Can't find it? Enter manually"}
              </button>
            </div>

            {manualMode ? (
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                type="text"
                placeholder="Merchant name as it appears on your bank statement"
                className={inputClass}
              />
            ) : matchedTransaction ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-raised px-3 py-2">
                <span className="text-sm text-ink truncate">{matchedTransaction.merchant}</span>
                <button
                  type="button"
                  onClick={clearMatch}
                  aria-label="Clear matched transaction"
                  className="text-ink-3 hover:text-ink transition-colors text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  placeholder="Search your transactions..."
                  className={inputClass}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-line bg-card shadow-xl">
                    {searchResults.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTransaction(t)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-raised transition-colors"
                      >
                        <span className="truncate text-ink-2">{t.merchant}</span>
                        <span className="text-ink-3 tabular-nums shrink-0">
                          {formatAmount(-t.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <input
          value={amount ?? ''}
          onChange={(e) => setAmount(e.target.value === '' ? null : Number(e.target.value))}
          type="number"
          placeholder="Amount"
          min={0}
          step={0.01}
          className={inputClass}
        />

        <select
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value)
            setDueDay(null)
            setCustomDate('')
          }}
          className={inputClass}
        >
          <option value="Weekly">Weekly</option>
          <option value="BiWeekly">Bi-Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
          <option value="Custom">Custom Date</option>
        </select>

        {showDueDay && (
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Due Day of Month</label>
            <input
              value={dueDay ?? ''}
              onChange={(e) => setDueDay(e.target.value === '' ? null : Number(e.target.value))}
              type="number"
              placeholder="e.g. 15"
              min={1}
              max={28}
              className={inputClass}
            />
          </div>
        )}

        {showCustomDate && (
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Due Date</label>
            <input
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              type="date"
              className={inputClass}
            />
          </div>
        )}

        <select
          size={5}
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className={`${inputClass} max-h-36 overflow-y-auto`}
        >
          <option value="">No Category</option>
          {categories
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (ch) => ch.toUpperCase())}
              </option>
            ))}
        </select>

        <label className="flex items-center gap-3 text-sm text-ink-2 cursor-pointer">
          <div onClick={() => setIsAutoPay((p) => !p)} className={toggleTrackClass(isAutoPay)}>
            <div className={toggleThumbClass(isAutoPay)} />
          </div>
          Auto-pay
        </label>

        {error && <p className={errorClass}>{error}</p>}

        <button onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Bill'}
        </button>
      </div>
    </div>
  )
}
