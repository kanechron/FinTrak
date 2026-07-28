import { useState, useEffect } from 'react'
import { updateBill, type Bill } from '../../api/bills'
import { getCategories, type Category } from '../../api/categories'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, toggleTrackClass, toggleThumbClass } from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  bill: Bill
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditBillModal({ bill, isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState(bill.name)
  const [displayName, setDisplayName] = useState(bill.displayName)
  const [amount, setAmount] = useState<number | null>(bill.amount)
  const [frequency, setFrequency] = useState(bill.frequency)
  const [dueDay, setDueDay] = useState<number | null>(bill.dueDay)
  const [customDate, setCustomDate] = useState(bill.customDate ?? '')
  const [isAutoPay, setIsAutoPay] = useState(bill.isAutoPay)
  const [categoryId, setCategoryId] = useState<string | null>(bill.categoryId)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen)
      getCategories()
        .then(setCategories)
        .catch(() => {})
  }, [isOpen])

  useEffect(() => {
    setName(bill.name)
    setDisplayName(bill.displayName)
    setAmount(bill.amount)
    setFrequency(bill.frequency)
    setDueDay(bill.dueDay)
    setCustomDate(bill.customDate ?? '')
    setIsAutoPay(bill.isAutoPay)
    setCategoryId(bill.categoryId)
    setError(null)
  }, [bill])

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  const showDueDay = ['Monthly', 'Quarterly', 'Yearly'].includes(frequency)
  const showCustomDate = frequency === 'Custom'

  async function handleSubmit() {
    if (!name || !displayName || !amount || amount <= 0) {
      setError('Display name, matching name, and amount are required.')
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
      await updateBill(bill.id, {
        name,
        displayName,
        amount: amount!,
        frequency,
        dueDay: showDueDay ? dueDay : null,
        customDate: showCustomDate ? customDate : null,
        isAutoPay,
        categoryId,
      })
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
          <h2 className={titleClass}>Edit Bill</h2>
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
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
