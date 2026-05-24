import AddGoalModal from "./AddGoalModal";
import ProgressBar from "./ProgressBar";
import {useState} from "react";
import {deleteGoal, type Goal} from "../api/goals"



interface Props {
    goals: Goal[] | null
    onGoalAdded: () => void
}

export default function GoalList({goals = [], onGoalAdded}: Props) {

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    const handleDelete = async (goalId: string) => {
        try {
            await deleteGoal(goalId)
            onGoalAdded()
        } catch (error) {
            console.error('Failed to delete goal:', error)
        }
    }


  return (
    <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-medium">Goals</h2>
            <button className="text-md text-blue-500 hover:text-blue-400 cursor-pointer"
            onClick={() => {setIsGoalModalOpen(true)}}>
                + Add Goal
                </button>
        </div>
        <AddGoalModal
            isOpen={isGoalModalOpen}
            onClose={() => setIsGoalModalOpen(false)}
            onSuccess={() => {
                setIsGoalModalOpen(false)
                onGoalAdded()
            }}
        />

        <div className="space-y-4">
            {goals?.map((g) => (
                <div key={g.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{g.name}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500">${g.currentAmount} / ${g.targetAmount}</span>
                            <button onClick={() => handleDelete(g.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                        </div>
                    </div>
                    <ProgressBar value={g.currentAmount} max={g.targetAmount!} />
                </div>
            ))}
        </div>
    </section>
  )
}