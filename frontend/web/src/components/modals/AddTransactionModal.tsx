import { useState, useEffect, useMemo } from 'react'
import { addTransaction } from '../../api/transactions'
import { getCategories, type Category } from '../../api/categories'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass } from './modalTheme'

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

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: Props) {
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)
  const [categoryDetailedId, setCategoryDetailedId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen)
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

  function stripParentPrefix(name: string) {
    const prefix = selectedParentName + '_'
    return name.startsWith(prefix) ? name.slice(prefix.length) : name
  }

  function handleParentChange(id: string | null) {
    setParentCategoryId(id)
    setCategoryDetailedId(null)
  }

  if (!isOpen) return null

  async function handleSubmit() {
    if (!merchant || !amount || amount <= 0) {
      setError('Merchant and a positive amount are required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await addTransaction({
        merchantName: merchant,
        amount: amount!,
        date,
        categoryId: parentCategoryId,
        categoryDetailedId,
        pending: false,
      })
      onSuccess()
      onClose()
      resetForm()
    } catch {
      setError('Failed to save transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setMerchant('')
    setAmount(null)
    setDate(new Date().toISOString().slice(0, 10))
    setParentCategoryId(null)
    setCategoryDetailedId(null)
    setError(null)
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Add Transaction</h2>

        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          type="text"
          placeholder="Merchant"
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

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Date</label>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Category</label>
          <select
            value={parentCategoryId ?? ''}
            onChange={(e) => handleParentChange(e.target.value || null)}
            className={inputClass}
          >
            <option value="">No Category</option>
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
                value={categoryDetailedId ?? ''}
                onChange={(e) => setCategoryDetailedId(e.target.value || null)}
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
          {isSubmitting ? 'Saving...' : 'Add Transaction'}
        </button>
      </div>
    </div>
  )
}
