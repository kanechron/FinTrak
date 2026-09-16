import RowMenu from './RowMenu'
import { updateRule, type Rule } from '../../api/rules'

interface Props {
  rule: Rule
  onDelete: (id: string) => void
  onClick: () => void
  onUpdate: () => void
}



export default function RuleCard({ rule, onDelete, onClick, onUpdate }: Props) {
  return (
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
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            rule.isActive ? 'text-good bg-good/15' : 'text-ink-3 bg-raised'
          }`}
        >
          {rule.isActive ? 'Active' : 'Inactive'}
        </span>
        <RowMenu
          ariaLabel="Rule options"
          actions={[
            { label: 'Edit', onClick: onClick },
            { label: rule.isActive ? 'Deactivate' : 'Activate', onClick: () => updateRule(rule.id, {...rule, isActive: !rule.isActive}).then(onUpdate)},
            { label: 'Delete', onClick: () => onDelete(rule.id), danger: true },
          ]}
        />
      </div>
    </div>
  )
}