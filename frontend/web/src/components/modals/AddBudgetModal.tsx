import { useState, useEffect, useMemo } from 'react'
import { addBudget } from '../../api/budgets'
import { getCategories, type Category } from '../../api/categories'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, toggleTrackClass, toggleThumbClass } from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const formatName = (name: string) =>
  name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

export default function AddBudgetModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [period, setPeriod] = useState('Monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [recurringDay, setRecurringDay] = useState('first')
  const [recurringDayCustom, setRecurringDayCustom] = useState<number>(1)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [isOpen])

  const parentCategories = useMemo(
    () =>
      categories.filter((c) => c.detailId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )

  const childCategories = useMemo(
    () =>
      parentCategoryId
        ? categories
            .filter((c) => c.detailId === parentCategoryId)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [categories, parentCategoryId]
  )

  const selectedParentName = useMemo(
    () => parentCategories.find((c) => c.id === parentCategoryId)?.name ?? '',
    [parentCategories, parentCategoryId]
  )

  function stripParentPrefix(catName: string) {
    const prefix = selectedParentName + '_'
    return catName.startsWith(prefix) ? catName.slice(prefix.length) : catName
  }

  function handleParentChange(id: string | null) {
    setParentCategoryId(id)
    setCategoryId(id)
  }

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  async function handleSubmit() {
    if (!name || !amount || amount <= 0 || !startDate) {
      setError('Name, amount, and start date are required.')
      return
    }
    setIsSubmitting(true)
    try {
      await addBudget({
        name,
        amount: amount!,
        period,
        startDate,
        endDate: period === 'Custom' ? endDate : null,
        isRecurring,
        categoryId,
        recurringDate: isRecurring ? recurringDay : null,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save budget.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Add Budget</h2>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Budget Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Budget Name"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Spending Limit</label>
          <input
            value={amount ?? ''}
            onChange={(e) => setAmount(e.target.value === '' ? null : Number(e.target.value))}
            type="number"
            placeholder="Spending Limit"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Period</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass}>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className={labelClass}>Start Date</label>
            <input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-2 cursor-pointer mt-4">
            <div
              onClick={() => setIsRecurring((p) => !p)}
              className={toggleTrackClass(isRecurring)}
            >
              <div className={toggleThumbClass(isRecurring)} />
            </div>
            Recurring
          </label>
        </div>

        {isRecurring && (
          <div className="flex gap-2">
            {recurringDay === 'custom' && period !== 'Weekly' && (
              <input
                type="number"
                min={1}
                max={28}
                value={recurringDayCustom}
                onChange={(e) => setRecurringDayCustom(Number(e.target.value))}
                className={`w-16 ${inputClass}`}
              />
            )}

            <select
              value={recurringDay}
              onChange={(e) => setRecurringDay(e.target.value)}
              className={`flex-1 ${inputClass}`}
            >
              {period === 'Weekly' ? (
                <>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </>
              ) : (
                <>
                  <option value="first">First</option>
                  <option value="last">Last</option>
                  <option value="custom">Custom</option>
                </>
              )}
            </select>
          </div>
        )}

        {period === 'Custom' && (
          <div className="flex flex-col gap-1">
            <label className={labelClass}>End Date</label>
            <input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Category</label>
          <select
            value={parentCategoryId ?? ''}
            onChange={(e) => handleParentChange(e.target.value || null)}
            className={inputClass}
          >
            <option value="">All Categories</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {formatName(c.name)}
              </option>
            ))}
          </select>

          {childCategories.length > 0 && (
            <>
              <label className={labelClass}>Subcategory</label>
              <select
                value={categoryId !== parentCategoryId ? (categoryId ?? '') : ''}
                onChange={(e) => setCategoryId(e.target.value || parentCategoryId)}
                className={inputClass}
              >
                <option value="">No Subcategory</option>
                {childCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatName(stripParentPrefix(c.name))}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {error && <p className={errorClass}>{error}</p>}

        <button onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving...' : 'Add Budget'}
        </button>
      </div>
    </div>
  )
}
