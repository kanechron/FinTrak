import { useState, useEffect } from 'react'
import { updateGoal, type Goal } from '../../api/goals'
import { deleteGoal } from '../../api/goals'
import AddGoalModal from '../modals/AddGoalModal'
import EditGoalModal from '../modals/EditGoalModal'
import SortableGoal from './SortableGoal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

interface Props {
  goals: Goal[] | null
  onGoalAdded: () => void
  accounts: { id: string; name: string; balance: number }[]
}

export default function GoalList({ goals = [], onGoalAdded, accounts }: Props) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // localGoals mirrors the goals prop but is updated optimistically on drag
  // so the UI reorders instantly without waiting for the server response
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals ?? [])

  useEffect(() => {
    setLocalGoals(goals ?? [])
  }, [goals])

  const sensors = useSensors(useSensor(PointerSensor))

  // Fall back to prop data before the first fetch completes
  const displayGoals = localGoals.length > 0 ? localGoals : (goals ?? [])

  const handleDelete = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
      onGoalAdded()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayGoals.findIndex(g => g.id === active.id)
    const newIndex = displayGoals.findIndex(g => g.id === over.id)
    const reordered = arrayMove(displayGoals, oldIndex, newIndex)
    const reorderedWithPriority = reordered.map((g, i) => ({ ...g, priority: i }))

    setLocalGoals(reorderedWithPriority)

    await Promise.all(
      reorderedWithPriority.map((g) => updateGoal(g.id, { priority: g.priority }))
    )
    onGoalAdded()
  }

  return (
    <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Goals</h2>
        <button
          className="text-md text-blue-500 hover:text-blue-400 cursor-pointer"
          onClick={() => setIsGoalModalOpen(true)}
        >
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
        accounts={accounts}
      />
      {selectedGoal && (
        <EditGoalModal
          goal={selectedGoal}
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onSuccess={() => { setSelectedGoal(null); onGoalAdded() }}
          accounts={accounts}
        />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {displayGoals.map((g) => (
              <SortableGoal key={g.id} goal={g} onDelete={handleDelete} onClick={() => setSelectedGoal(g)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  )
}
