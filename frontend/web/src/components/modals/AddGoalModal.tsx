import { useState } from 'react'
import { addGoal } from '../../api/goals'
import { overlayClass, cardClass, titleClass, labelClass, errorClass, inputClass, primaryButtonClass, chipClass } from './modalTheme'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accounts: { id: string; name: string; balance: number }[]
}

export default function AddGoalModal({ isOpen, onClose, onSuccess, accounts }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState<number | null>(null)
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<{ id: string; name: string }[]>([])
  const priority = 0
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      if (!name || targetAmount! <= 0) {
        setError('Please provide a valid name and target amount.')
        setIsSubmitting(false)
        return
      }
      await addGoal({
        name,
        targetAmount: targetAmount!,
        currentAmount: 0,
        targetDate,
        isActive: true,
        priority,
        linkedAccounts: linkedAccounts.map((a) => ({ id: a.id })),
      })
      onSuccess()
      setName('')
      setTargetAmount(null)
      setTargetDate(null)
      setLinkedAccounts([])
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
        <h2 className={titleClass}>Add New Goal</h2>

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
          <label className={labelClass}>Target Date</label>
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
                className={chipClass(linkedAccounts.some((acc) => acc.id === a.id))}
                onClick={() => {
                  if (linkedAccounts.some((acc) => acc.id === a.id)) {
                    setLinkedAccounts(linkedAccounts.filter((acc) => acc.id !== a.id))
                  } else {
                    setLinkedAccounts([...linkedAccounts, { id: a.id, name: a.name }])
                  }
                }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={errorClass}>{error}</p>}

        <button disabled={isSubmitting} className={primaryButtonClass} onClick={handleSubmit}>
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
