import { useState, useEffect } from 'react'
import { addGoal, updateGoal, type Goal } from '../../api/goals'
import {
  overlayClass,
  cardClass,
  titleClass,
  labelClass,
  errorClass,
  inputClass,
  primaryButtonClass,
  chipClass,
} from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accounts: { id: string; name: string; balance: number }[]
  goal?: Goal
}

export default function GoalFormModal({ isOpen, onClose, onSuccess, accounts, goal }: Props) {
  const isEdit = !!goal
  const today = new Date().toISOString().split('T')[0]

  const [name, setName] = useState(goal?.name ?? '')
  const [targetAmount, setTargetAmount] = useState<number | null>(goal?.targetAmount ?? null)
  const [targetDate, setTargetDate] = useState<string | null>(goal?.targetDate ?? null)
  const [linkedAccounts, setLinkedAccounts] = useState<{ id: string; name: string }[]>(
    goal?.linkedAccounts.map((a) => ({ id: a.id, name: a.name })) ?? []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useBodyScrollLock(isOpen)

  // Resync fields every time the modal opens, so closing without saving never leaves
  // stale text for the next open — whether that's a fresh Add or reopening the same Edit.
  useEffect(() => {
    if (!isOpen) return
    if (goal) {
      setName(goal.name)
      setTargetAmount(goal.targetAmount)
      setTargetDate(goal.targetDate)
      setLinkedAccounts(goal.linkedAccounts.map((a) => ({ id: a.id, name: a.name })))
    } else {
      setName('')
      setTargetAmount(null)
      setTargetDate(null)
      setLinkedAccounts([])
    }
    setError(null)
  }, [isOpen, goal])

  if (!isOpen) return null

  function toggleAccount(a: { id: string; name: string }) {
    if (linkedAccounts.some((acc) => acc.id === a.id)) {
      setLinkedAccounts(linkedAccounts.filter((acc) => acc.id !== a.id))
    } else {
      setLinkedAccounts([...linkedAccounts, { id: a.id, name: a.name }])
    }
  }

  async function handleSubmit() {
    if (!name || !targetAmount || targetAmount <= 0) {
      setError('Please provide a valid name and target amount.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await updateGoal(goal.id, {
          name,
          targetAmount,
          targetDate,
          isActive: goal.isActive,
          priority: goal.priority,
          currentAmount: goal.currentAmount,
          linkedAccounts: linkedAccounts.map((a) => ({ id: a.id, name: '', mask: '' })),
        })
      } else {
        await addGoal({
          name,
          targetAmount,
          currentAmount: 0,
          targetDate,
          isActive: true,
          priority: 0,
          linkedAccounts: linkedAccounts.map((a) => ({ id: a.id })),
        })
      }
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save goal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        {isEdit ? (
          <div className="flex items-center justify-between">
            <h2 className={titleClass}>Edit Goal</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-3 hover:text-ink transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        ) : (
          <h2 className={titleClass}>Add New Goal</h2>
        )}

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Goal Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Goal Name"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Target Amount</label>
          <input
            value={targetAmount ?? ''}
            onChange={(e) => setTargetAmount(e.target.value === '' ? null : Number(e.target.value))}
            type="number"
            placeholder="Target Amount"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Target Date{isEdit ? ' (optional)' : ''}</label>
          <input
            value={targetDate || ''}
            onChange={(e) => setTargetDate(e.target.value || null)}
            type="date"
            min={today}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Linked Accounts</label>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleAccount(a)}
                className={chipClass(linkedAccounts.some((acc) => acc.id === a.id))}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={errorClass}>{error}</p>}

        <button disabled={isSubmitting} className={primaryButtonClass} onClick={handleSubmit}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
