import { useState, useEffect, useMemo } from 'react'
import {
  addTransaction,
  updateTransaction,
  applyCategoryByMerchant,
  type Transaction,
} from '../../api/transactions'
import { getCategories, type Category } from '../../api/categories'
import {
  overlayClass,
  cardClass,
  titleClass,
  labelClass,
  errorClass,
  inputClass,
  primaryButtonClass,
  checkboxClass,
} from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction
}

const formatName = (name: string) =>
  name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionFormModal({ isOpen, onClose, onSuccess, transaction }: Props) {
  const isEdit = !!transaction

  const [merchant, setMerchant] = useState(transaction?.merchant ?? '')
  const [amount, setAmount] = useState<number | null>(transaction?.amount ?? null)
  const [date, setDate] = useState(transaction?.date ?? today())
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(
    transaction?.categoryId ?? null
  )
  const [categoryDetailedId, setCategoryDetailedId] = useState<string | null>(
    transaction?.categoryDetailedId ?? null
  )
  const [applyToAll, setApplyToAll] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [isOpen])

  // Resync fields every time the modal opens, so closing without saving never leaves
  // stale text for the next open — whether that's a fresh Add or reopening the same Edit.
  useEffect(() => {
    if (!isOpen) return
    if (transaction) {
      setMerchant(transaction.merchant)
      setAmount(transaction.amount)
      setDate(transaction.date)
      setParentCategoryId(transaction.categoryId)
      setCategoryDetailedId(transaction.categoryDetailedId)
    } else {
      setMerchant('')
      setAmount(null)
      setDate(today())
      setParentCategoryId(null)
      setCategoryDetailedId(null)
    }
    setApplyToAll(false)
    setError(null)
  }, [isOpen, transaction])

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

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  async function handleSubmit() {
    if (!merchant) {
      setError('Merchant is required.')
      return
    }
    if (isEdit) {
      if (amount !== null && amount <= 0) {
        setError('Amount must be positive.')
        return
      }
    } else if (!amount || amount <= 0) {
      setError('Merchant and a positive amount are required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await updateTransaction(transaction.id, {
          merchantName: merchant,
          amount,
          date,
          categoryId: parentCategoryId,
          categoryDetailedId,
        })
        if (applyToAll) await applyCategoryByMerchant(merchant, parentCategoryId)
      } else {
        await addTransaction({
          merchantName: merchant,
          amount: amount!,
          date,
          categoryId: parentCategoryId,
          categoryDetailedId,
          pending: false,
        })
      }
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
      <div
        className={cardClass(isEdit ? 'max-w-xl' : 'max-w-md')}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={titleClass}>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>

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

        {isEdit && (
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
        )}

        {error && <p className={errorClass}>{error}</p>}

        <button onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </div>
  )
}
