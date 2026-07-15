import { useState, useEffect, useMemo } from 'react'
import {
  updateTransaction,
  applyCategoryByMerchant,
  type Transaction,
} from '../../api/transactions'
import { getCategories, type Category } from '../../api/categories'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, checkboxClass } from './modalTheme'

interface Props {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const formatName = (name: string) =>
  name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

export default function EditTransactionModal({ transaction, isOpen, onClose, onSuccess }: Props) {
  const [merchant, setMerchant] = useState(transaction.merchant)
  const [amount, setAmount] = useState<number | null>(transaction.amount)
  const [date, setDate] = useState(transaction.date)
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(transaction.categoryId)
  const [categoryDetailedId, setCategoryDetailedId] = useState<string | null>(
    transaction.categoryDetailedId
  )
  const [applyToAll, setApplyToAll] = useState(false)
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
    setMerchant(transaction.merchant)
    setAmount(transaction.amount)
    setDate(transaction.date)
    setParentCategoryId(transaction.categoryId)
    setCategoryDetailedId(transaction.categoryDetailedId)
    setApplyToAll(false)
    setError(null)
  }, [transaction])

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
    if (!merchant) {
      setError('Merchant is required.')
      return
    }
    if (amount !== null && amount <= 0) {
      setError('Amount must be positive.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await updateTransaction(transaction.id, {
        merchantName: merchant,
        amount,
        date,
        categoryId: parentCategoryId,
        categoryDetailedId,
      })
      if (applyToAll) await applyCategoryByMerchant(merchant, parentCategoryId)
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass('max-w-xl')} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Edit Transaction</h2>

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

        <label className="flex items-center gap-3 text-sm text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className={checkboxClass}
          />
          Apply category to all <span className="text-ink font-medium">{merchant}</span>{' '}
          transactions
        </label>

        {error && <p className={errorClass}>{error}</p>}

        <button onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
