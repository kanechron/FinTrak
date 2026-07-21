import ProgressBar from '../common/ProgressBar'
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
    <div ref={setNodeRef} style={style} className="group flex items-stretch gap-1.5">
      <span
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab text-ink-3 hover:text-ink-2 select-none px-1.5"
      >
        ⠿
      </span>
      <div onClick={onClick} className="flex-1 cursor-pointer">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-ink font-medium">{goal.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-ink-2 tabular-nums">
              ${goal.currentAmount} / ${goal.targetAmount}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(goal.id)
              }}
              className="text-ink-3 hover:text-bad transition-colors text-sm opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
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
    </div>
  )
}
