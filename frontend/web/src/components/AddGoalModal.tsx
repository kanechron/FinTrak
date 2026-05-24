import { useState } from "react"
import { addGoal } from "../api/goals"


interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddGoalModal({ isOpen, onClose, onSuccess }: Props) {
    
    const [name, setName] = useState('')
    const [targetAmount, setTargetAmount] = useState<number | null>(null)
    const [targetDate, setTargetDate] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    if (!isOpen) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)

    

    try {
        if(!name || targetAmount! <= 0) {
        setError('Please provide a valid name and target amount.')
        setIsSubmitting(false)
        return
    }
        await addGoal({ name, targetAmount: targetAmount!, currentAmount: 0, targetDate, isActive: true })
        onSuccess()
        onClose()
    }
    catch (error) {
        setError('failed to save goal.')
    }
    finally {
        setIsSubmitting(false)
    }
}

  // rest of modal...
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-lg font-medium">Add New Goal</h2>
                {/* Form fields for goal name, target amount, target date */}
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Goal Name" className="w-full p-2 bg-gray-800 rounded" />
                
                <input value={targetAmount || ''} onChange={(e) => setTargetAmount(e.target.value === '' ? null : Number(e.target.value))} type="number" placeholder="Target Amount" className="w-full p-2 bg-gray-800 rounded" />
                <h3 className="text-md font-medium">Target Date</h3>
                <input value={targetDate || ''} onChange={(e) => setTargetDate(e.target.value || null)} type="date" className="w-full p-2 bg-gray-800 rounded" />
                
                <br/>
                <button className="mt-4 bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}