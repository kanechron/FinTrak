import { useState, useEffect } from 'react'
import { updateGoal, type Goal } from '../../api/goals'
import { deleteGoal } from '../../api/goals'
import AddGoalModal from '../modals/AddGoalModal'
import EditGoalModal from '../modals/EditGoalModal'
import SortableGoal from './SortableGoal'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

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

  // Separate mouse/touch sensors (rather than PointerSensor) so touch gets its own
  // activation constraint: a short delay + movement tolerance before a drag starts,
  // so a tap-and-scroll on the handle isn't immediately hijacked as a drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

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

    const oldIndex = displayGoals.findIndex((g) => g.id === active.id)
    const newIndex = displayGoals.findIndex((g) => g.id === over.id)
    const reordered = arrayMove(displayGoals, oldIndex, newIndex)
    const reorderedWithPriority = reordered.map((g, i) => ({ ...g, priority: i }))

    setLocalGoals(reorderedWithPriority)

    await Promise.all(reorderedWithPriority.map((g) => updateGoal(g.id, { priority: g.priority })))
    onGoalAdded()
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-medium text-ink">Goals</h2>
        {displayGoals.length > 1 && (
          <span className="text-xs text-ink-3">Drag to reorder by priority</span>
        )}
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
          onSuccess={() => {
            setSelectedGoal(null)
            onGoalAdded()
          }}
          accounts={accounts}
        />
      )}
      {displayGoals.length === 0 ? (
        <p className="text-sm text-ink-3 text-center py-4">
          No goals yet — add one to get started.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={displayGoals.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-7">
              {displayGoals.map((g, i) => (
                <SortableGoal
                  key={g.id}
                  goal={g}
                  onDelete={handleDelete}
                  onClick={() => setSelectedGoal(g)}
                  colorIndex={i}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <button
        onClick={() => setIsGoalModalOpen(true)}
        className="w-full text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity mt-5 pt-4 border-t border-line"
      >
        + Add Goal
      </button>
    </section>
  )
}
