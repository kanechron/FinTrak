import RowMenu from './RowMenu'
import { updateRule, type Rule } from '../../api/rules'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  rule: Rule
  onDelete: (id: string) => void
  onClick: () => void
  onUpdate: () => void
}



export default function RuleCard({ rule, onDelete, onClick, onUpdate }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing -mx-2.5 -my-2 px-2.5 py-2 rounded-lg hover:bg-raised transition-colors"
    >
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-[13px] font-medium text-ink-2">{rule.ruleName}</p>
          <p className="text-[11.5px] text-ink-3 mt-0.5">
            Priority {rule.priority} · {rule.conditions.length} condition
            {rule.conditions.length === 1 ? '' : 's'} · {rule.actions.length} action
            {rule.actions.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${rule.isActive ? 'text-good bg-good/15' : 'text-ink-3 bg-raised'
              }`}
          >
            {rule.isActive ? 'Active' : 'Inactive'}
          </span>
          <RowMenu
            ariaLabel="Rule options"
            actions={[
              { label: 'Edit', onClick: onClick },
              { label: rule.isActive ? 'Deactivate' : 'Activate', onClick: () => updateRule(rule.id, { ...rule, isActive: !rule.isActive }).then(onUpdate) },
              { label: 'Delete', onClick: () => onDelete(rule.id), danger: true },
            ]}
          />
        </div>
      </div>
    </div>
  )
}