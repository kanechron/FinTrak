import { useEffect, useState } from 'react'
import {
  ACTION_FIELDS,
  ACTION_TYPES,
  addRule,
  CONDITION_FIELDS,
  OPERATORS,
  TRIGGER_TYPES,
  type Rule,
  type Action,
  type Condition,
  type TargetType,
  type TriggerType,
  updateRule,
} from '../../api/rules'
import { ApiError } from '../../api/client'
import { labelClass, inputClass, errorClass, checkboxClass, primaryButtonClass } from '../modals/modalTheme'
import { useFieldMap } from '../../hooks/FieldMapProvider'
import { useToast } from '../../hooks/ToastProvider'

interface Props {
  target: TargetType
  onCancel: () => void
  onSuccess: () => void
  rule?: Rule
  nextPriority: number
}

function newCondition(): Condition {
  return {
    groupId: crypto.randomUUID(),
    conditionField: CONDITION_FIELDS[0],
    conditionOperator: undefined,
    conditionValue: '',
    not: false,
  }
}

function newAction(): Action {
  return {
    actionField: ACTION_FIELDS[0],
    actionType: undefined,
    actionValue: '',
  }
}

export default function RuleForm({ onSuccess, onCancel, target, rule, nextPriority }: Props) {
  // Field Map
  const fieldmap = useFieldMap(target)
  const toast = useToast()

  const isEdit = !!rule

  // Rule-level fields
  const [ruleName, setRuleName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [priority, setPriority] = useState(nextPriority)
  const [recursive, setRecursive] = useState(false)
  const [trigger, setTrigger] = useState<TriggerType>(TRIGGER_TYPES[0])

  const [error, setError] = useState<string | null>(null)

  // Conditions/Actions
  const [conditions, setConditions] = useState<Condition[]>([newCondition()])
  const [actions, setActions] = useState<Action[]>([newAction()])

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function updateAction(index: number, patch: Partial<Action>) {
    setActions(prev => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  function handleConflictingConditions(conditions: Condition[]): boolean {

    const conditionMap = new Map<string, Condition[]>()

    conditions.forEach((c) => {
      const check = `${c.groupId}/${c.conditionField}`
      const existing = conditionMap.get(check)
      existing ? existing.push(c) : conditionMap.set(check, [c])
    })

    //check each groupId's cluster of conditionFields to see if any condition operators are EQUALS and have more than that singular condition. if so, it's not valid, return false and throw an error.
    return Array.from(conditionMap.values()).some((c) => c.some(o => o.conditionOperator === "EQUALS") && c.length > 1)
  }

  async function handleSave() {
    if(handleConflictingConditions(conditions)) {
      setError(`A field can't be checked twice with 'EQUALS' in the same group`)
      return
    }
    
    if (!ruleName || !conditions || !actions) {
      setError('Rule Name, Conditions, and Actions are required')
      return
    }
    setError(null)

    try {
      const payload = {
        ruleName,
        conditions,
        actions,
        recursive,
        trigger,
        isActive,
        target,
        priority,
      }
      if (isEdit) {
        await updateRule(rule.id, { ...payload })
      }
      else {
        await addRule({ ...payload, priority: nextPriority })
      }
      toast.success({
        title: 'Rule saved',
        content: ruleName
      })
      onSuccess()
    }
    catch (err) {
      toast.error({
        title: 'Rule failed to save',
        content: err instanceof ApiError ? err.message : 'Please try again'
      })
    }
  }

  useEffect(() => {
    if (rule) {
      setRuleName(rule.ruleName)
      setIsActive(rule.isActive)
      setPriority(rule.priority)
      setRecursive(rule.recursive)
      setTrigger(rule.trigger ?? TRIGGER_TYPES[0])
      setConditions(rule.conditions)
      setActions(rule.actions)
    }
    else {
      setRuleName('')
      setIsActive(true)
      setPriority(nextPriority)
      setRecursive(false)
      setTrigger(TRIGGER_TYPES[0])
      setConditions([newCondition()])
      setActions([newAction()])
    }
  }, [rule])

  return (
    <>
      {
        !fieldmap ? (
          <p className="text-center text-ink-3 text-sm py-12" > Loading... </p>
        ) :
          (
            <div className="flex flex-col gap-4 py-4 border-b border-line">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Rule Name</label>
                <input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  type="text"
                  placeholder="Rule Name"
                  className={inputClass}
                />
              </div>

              {/* Priority is driven entirely by drag order in RulesBlock now, not user-editable here. */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Trigger</label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value as TriggerType)}
                    className={inputClass}
                  >
                    {TRIGGER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className={checkboxClass}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    checked={recursive}
                    onChange={(e) => setRecursive(e.target.checked)}
                    className={checkboxClass}
                  />
                  Apply to past transactions
                </label>
              </div>

              {/* Conditions */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Conditions</label>
                  <button 
                    onClick={() => setConditions([...conditions, newCondition()])}
                    className="text-xs font-semibold text-s1 hover:opacity-80 cursor-pointer"
                  >
                    + Add Condition
                  </button>
                </div>

                {conditions.map((condition, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <div className="h-px flex-1 bg-line" />
                        <select
                          value={condition.groupId === conditions[i - 1].groupId ? 'AND' : 'OR'}
                          onChange={(e) => {
                            updateCondition(i, {
                              groupId: e.target.value === 'AND' ? conditions[i - 1].groupId : crypto.randomUUID(),
                            })
                          }}
                          className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-raised border border-line text-ink-3 cursor-pointer focus:outline-none focus:border-line-2"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                        <div className="h-px flex-1 bg-line" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                    <select
                      value={condition.conditionField}
                      onChange={(e) => {
                        updateCondition(i, { conditionField: e.target.value as Condition['conditionField'], conditionOperator: fieldmap.conditions[e.target.value as Condition['conditionField']][0] })
                      }}
                      className={inputClass}
                    >
                      {CONDITION_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.conditionOperator ?? ''}
                      onChange={(e) =>
                        updateCondition(i, { conditionOperator: e.target.value as Condition['conditionOperator'] })
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>Select Operator...</option>
                      {fieldmap?.conditions[condition.conditionField].map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>

                    <input
                      value={condition.conditionValue}
                      onChange={(e) => updateCondition(i, { conditionValue: e.target.value })}
                      type="text"
                      placeholder="Value"
                      className={inputClass}
                    />

                    <label className="flex items-center gap-1 text-xs text-ink-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={condition.not}
                        onChange={(e) => updateCondition(i, { not: e.target.checked })}
                        className={checkboxClass}
                      />
                      Not
                    </label>

                    <button
                      onClick={() => setConditions(conditions.filter((_, ci) => ci !== i))}
                      aria-label="Remove condition"
                      className="text-ink-3 hover:text-bad transition-colors shrink-0"
                    >
                      ✕
                    </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Actions</label>
                  <button
                    onClick={() => setActions([...actions, newAction()])}
                    className="text-xs font-semibold text-s1 hover:opacity-80 cursor-pointer"
                  >
                    + Add Action
                  </button>
                </div>

                {actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={action.actionField}
                      onChange={(e) => {
                        updateAction(i, { actionField: e.target.value as Action['actionField'], actionType: fieldmap.actions[e.target.value as Action['actionField']][0] })
                      }}
                      className={inputClass}
                    >
                      {ACTION_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <select
                      value={action.actionType ?? ''}
                      onChange={(e) => updateAction(i, { actionType: e.target.value as Action['actionType'] })}
                      className={inputClass}
                    >
                      <option value="" disabled>Select Action Type...</option>
                      {fieldmap?.actions[action.actionField].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <input
                      value={action.actionValue}
                      onChange={(e) => updateAction(i, { actionValue: e.target.value })}
                      type="text"
                      placeholder="Value"
                      className={inputClass}
                    />

                    <button
                      onClick={() => setActions(actions.filter((_, ai) => ai !== i))}
                      aria-label="Remove action"
                      className="text-ink-3 hover:text-bad transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <p className={errorClass}>{error}</p>

              <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="text-sm text-ink-3 hover:text-ink-2 transition-colors px-4 py-2">
                  Cancel
                </button>
                <button
                  className={`${primaryButtonClass} !w-auto px-6`}
                  onClick={handleSave}>Save Rule</button>
              </div>
            </div>
          )
      }
    </>
  )
}
