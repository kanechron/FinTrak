import { useState, useEffect } from 'react'
import { updateTransaction, applyCategoryByMerchant, type Transaction } from '../../api/transactions'
import { getCategories, type Category } from '../../api/categories'

interface Props {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const inputClass = "w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"

export default function EditTransactionModal({ transaction, isOpen, onClose, onSuccess }: Props) {
  const [merchant, setMerchant] = useState(transaction.merchant)
  const [amount, setAmount] = useState<number | null>(transaction.amount)
  const [date, setDate] = useState(transaction.date)
  const [categoryId, setCategoryId] = useState<string | null>(transaction.categoryId)
  const [applyToAll, setApplyToAll] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) getCategories().then(setCategories).catch(() => {})
  }, [isOpen])

  useEffect(() => {
    setMerchant(transaction.merchant)
    setAmount(transaction.amount)
    setDate(transaction.date)
    setCategoryId(transaction.categoryId)
    setApplyToAll(false)
    setError(null)
  }, [transaction])

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
      await updateTransaction(transaction.id, { merchantName: merchant, amount, date, categoryId })
      if (applyToAll) await applyCategoryByMerchant(merchant, categoryId)
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-xl flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium">Edit Transaction</h2>

        <input
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          type="text"
          placeholder="Merchant"
          className={inputClass}
        />

        <input
          value={amount ?? ''}
          onChange={e => setAmount(e.target.value === '' ? null : Number(e.target.value))}
          type="number"
          placeholder="Amount"
          min={0}
          step={0.01}
          className={inputClass}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Date</label>
          <input
            value={date}
            onChange={e => setDate(e.target.value)}
            type="date"
            className={inputClass}
          />
        </div>

        <select
          size={5}
          value={categoryId ?? ''}
          onChange={e => setCategoryId(e.target.value || null)}
          className={`${inputClass} max-h-36 overflow-y-auto`}
        >
          <option value="">No Category</option>
          {categories.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.id} value={c.id}>
              {c.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase())}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={e => setApplyToAll(e.target.checked)}
            className="accent-blue-500 w-4 h-4"
          />
          Apply category to all <span className="text-gray-200 font-medium">{merchant}</span> transactions
        </label>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
