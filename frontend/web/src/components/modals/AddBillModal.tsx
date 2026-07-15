import { useState, useEffect } from 'react'
import { addBill } from '../../api/bills'
import { getCategories, type Category } from '../../api/categories'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, toggleTrackClass, toggleThumbClass } from './modalTheme'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddBillModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [frequency, setFrequency] = useState('Monthly')
  const [dueDay, setDueDay] = useState<number | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [isAutoPay, setIsAutoPay] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen)
      getCategories()
        .then(setCategories)
        .catch(() => {})
  }, [isOpen])

  if (!isOpen) return null

  const showDueDay = ['Monthly', 'Quarterly', 'Yearly'].includes(frequency)
  const showCustomDate = frequency === 'Custom'

  async function handleSubmit() {
    if (!name || !amount || amount <= 0) {
      setError('Name and amount are required.')
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
      await addBill({
        name,
        amount: amount!,
        frequency,
        dueDay: showDueDay ? dueDay : null,
        customDate: showCustomDate ? customDate : null,
        lastPaidDate: null,
        isAutoPay,
        categoryId,
      })
      onSuccess()
      onClose()
      resetForm()
    } catch {
      setError('Failed to save bill.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setName('')
    setAmount(null)
    setFrequency('Monthly')
    setDueDay(null)
    setCustomDate('')
    setIsAutoPay(false)
    setCategoryId(null)
    setError(null)
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Add Bill</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Bill Name"
          className={inputClass}
        />

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
          {isSubmitting ? 'Saving...' : 'Add Bill'}
        </button>
      </div>
    </div>
  )
}
