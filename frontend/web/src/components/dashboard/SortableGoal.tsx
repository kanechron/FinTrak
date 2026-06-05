import ProgressBar from '../common/ProgressBar'
import { type Goal } from '../../api/goals'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  goal: Goal
  onDelete: (id: string) => void
  onClick: () => void
}

export default function SortableGoal({ goal, onDelete, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-1">
      <span {...attributes} {...listeners} className="flex items-center cursor-grab text-gray-600 hover:text-gray-400 select-none px-1">⠿</span>
      <div onClick={onClick} className="flex-1 space-y-1.5 border border-gray-800 rounded-lg p-3 cursor-pointer hover:border-gray-600 hover:bg-gray-800/40 transition-colors">
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">{goal.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">${goal.currentAmount} / ${goal.targetAmount}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(goal.id) }} className="text-red-500 hover:text-red-400 transition-colors text-sm">✕</button>
        </div>
      </div>
      {goal.linkedAccounts.length > 0 && (
        <div className="text-xs text-gray-400">
          {goal.linkedAccounts.map(a => `${a.name} ••••${a.mask}`).join(' · ')}
        </div>
      )}
      <ProgressBar value={goal.currentAmount} max={goal.targetAmount!} />
      </div>
    </div>
  )
}
