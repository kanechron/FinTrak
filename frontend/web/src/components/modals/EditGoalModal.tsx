import { useState, useEffect } from 'react'
import { updateGoal, type Goal } from '../../api/goals'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, chipClass } from './modalTheme'

interface Props {
  goal: Goal
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accounts: { id: string; name: string; balance: number }[]
}

export default function EditGoalModal({ goal, isOpen, onClose, onSuccess, accounts }: Props) {
  const [name, setName] = useState(goal.name)
  const [targetAmount, setTargetAmount] = useState<number | null>(goal.targetAmount)
  const [targetDate, setTargetDate] = useState<string | null>(goal.targetDate)
  const [linkedAccounts, setLinkedAccounts] = useState<{ id: string; name: string }[]>(
    goal.linkedAccounts.map((a) => ({ id: a.id, name: a.name }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state when a different goal is opened
  useEffect(() => {
    setName(goal.name)
    setTargetAmount(goal.targetAmount)
    setTargetDate(goal.targetDate)
    setLinkedAccounts(goal.linkedAccounts.map((a) => ({ id: a.id, name: a.name })))
    setError(null)
  }, [goal])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name || !targetAmount || targetAmount <= 0) {
      setError('Please provide a valid name and target amount.')
      return
    }
    setIsSubmitting(true)
    try {
      await updateGoal(goal.id, {
        name,
        targetAmount,
        targetDate,
        isActive: goal.isActive,
        priority: goal.priority,
        currentAmount: goal.currentAmount,
        linkedAccounts: linkedAccounts.map((a) => ({ id: a.id, name: '', mask: '' })),
      })
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save goal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAccount = (a: { id: string; name: string }) => {
    if (linkedAccounts.some((acc) => acc.id === a.id)) {
      setLinkedAccounts(linkedAccounts.filter((acc) => acc.id !== a.id))
    } else {
      setLinkedAccounts([...linkedAccounts, { id: a.id, name: a.name }])
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
        <h2 className={titleClass}>Edit Goal</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Goal Name"
          className={inputClass}
        />

        <input
          value={targetAmount ?? ''}
          onChange={(e) => setTargetAmount(e.target.value === '' ? null : Number(e.target.value))}
          type="number"
          placeholder="Target Amount"
          className={inputClass}
        />

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Target Date</label>
          <input
            value={targetDate || ''}
            onChange={(e) => setTargetDate(e.target.value || null)}
            type="date"
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

        <button onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
