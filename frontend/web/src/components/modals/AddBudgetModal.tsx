import { useState } from 'react'
import { addBudget } from '../../api/budgets'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddBudgetModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [period, setPeriod] = useState('Monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        isRecurring
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium">Add Budget</h2>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          type="text"
          placeholder="Budget Name"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
        />

        <input
          value={amount ?? ''}
          onChange={e => setAmount(e.target.value === '' ? null : Number(e.target.value))}
          type="number"
          placeholder="Spending Limit"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
        />

        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
          <option value="Custom">Custom</option>
        </select>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Start Date</label>
          <input
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            type="date"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
          />
        </div>

        {period === 'Custom' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">End Date</label>
            <input
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              type="date"
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}

        <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            className={`w-9 h-5 rounded-full transition-colors ${isRecurring ? 'bg-emerald-500' : 'bg-gray-700'} relative`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          Recurring
        </label>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Add Budget'}
        </button>
      </div>
    </div>
  )
}
