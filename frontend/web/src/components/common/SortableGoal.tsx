import ProgressBar from '../common/ProgressBar'
import RowMenu from '../common/RowMenu'
import { type Goal } from '../../api/goals'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const GOAL_COLORS = ['bg-s1', 'bg-s2', 'bg-s3', 'bg-s4', 'bg-s5', 'bg-s6', 'bg-s7', 'bg-s8']

interface Props {
  goal: Goal
  onDelete: (id: string) => void
  onClick: () => void
  colorIndex?: number
}

export default function SortableGoal({ goal, onDelete, onClick, colorIndex = 0 }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length]

  return (
    // The whole card is the drag surface (no separate handle) — this only works cleanly
    // because GoalList's sensors require a distance/delay before a drag activates, so a
    // plain click still reaches the Edit/Delete menu and progress bar underneath.
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing -mx-2.5 -my-2 px-2.5 py-2 rounded-lg hover:bg-raised transition-colors"
    >
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-ink font-medium">{goal.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-ink-2 tabular-nums">
            ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount!.toFixed(2)}
          </span>
          <RowMenu
            ariaLabel="Goal options"
            actions={[
              { label: 'Edit', onClick: onClick },
              { label: 'Delete', onClick: () => onDelete(goal.id), danger: true },
            ]}
          />
        </div>
      </div>
      {goal.linkedAccounts.length > 0 ? (
        <div className="text-xs text-ink-3 mb-2">
          {goal.linkedAccounts.map((a) => `${a.name} ••••${a.mask}`).join(' · ')}
        </div>
      ) : (
        <div className="text-xs text-warn mb-2">Link an account to track progress</div>
      )}
      <ProgressBar value={goal.currentAmount} max={goal.targetAmount!} color={color} />
    </div>
  )
}
