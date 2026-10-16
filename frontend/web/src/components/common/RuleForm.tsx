import { useEffect, useState } from 'react'
import {
  ACTION_FIELDS,
  addRule,
  CONDITION_FIELDS,
  EXCLUSION_FLAGS,
  TRIGGER_TYPES,
  type ActionField,
  type Rule,
  type Action,
  type Condition,
  type TargetType,
  type TriggerType,
  updateRule,
} from '../../api/rules'
import { ApiError } from '../../api/client'
import { getParentCategories, type Category } from '../../api/categories'
import { labelClass, inputClass, errorClass, checkboxClass, primaryButtonClass } from '../modals/modalTheme'
import { useFieldMap } from '../../hooks/FieldMapProvider'
import { useToast } from '../../hooks/ToastProvider'

interface Props {
  target: TargetType
  onCancel: () => void
  onSuccess: () => void
  rule?: Rule
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

function newExclusionAction(): Action {
  return {
    actionField: 'Exclusion',
    actionType: 'Exclude',
    actionValue: '',
  }
}

export default function RuleForm({ onSuccess, onCancel, target, rule }: Props) {
  // Field Map
  const fieldmap = useFieldMap(target)
  const toast = useToast()

  const isEdit = !!rule

  // Rule-level fields
  const [ruleName, setRuleName] = useState('')
  const [isActive, setIsActive] = useState(true)
  // No priority here: the server assigns it on create (end of the list), and it only changes via drag-and-drop reorder.
  const [recursive, setRecursive] = useState(false)
  const [trigger, setTrigger] = useState<TriggerType>(TRIGGER_TYPES[0])

  const [error, setError] = useState<string | null>(null)

  // Conditions/Actions
  const [conditions, setConditions] = useState<Condition[]>([newCondition()])
  const [actions, setActions] = useState<Action[]>([newAction()])

  // Options for Category actions. Parent categories only: SetAction writes CategoryId (the parent), not CategoryDetailedId.
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getParentCategories()
      .then(setCategories)
      .catch(() => toast.error({ title: 'Failed to load categories', content: 'Category actions will be unavailable.' }))
  }, [])

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function updateAction(index: number, patch: Partial<Action>) {
    setActions(prev => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  // A rule is either an action rule or an exclusion rule, never both (the backend derives `kind` from this).
  const isExclusionRule = actions.some((a) => a.actionField === 'Exclusion')

  // Which action fields a given row may pick: once any OTHER row is an exclusion, only 'Exclusion';
  // once any other row is a normal action, never 'Exclusion'. Editing never offers 'Exclusion' — an existing
  // action rule can't become an exclusion rule, and exclusion rules can't be edited at all.
  function fieldOptionsFor(index: number): ActionField[] {
    const othersAreExclusion = actions.some((a, ai) => ai !== index && a.actionField === 'Exclusion')
    const othersAreAction = actions.some((a, ai) => ai !== index && a.actionField !== 'Exclusion')
    if (othersAreExclusion) return ['Exclusion']
    if (othersAreAction || isEdit) return [...ACTION_FIELDS]
    return [...ACTION_FIELDS, 'Exclusion']
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
        // Exclusions apply to new transactions from every source (the backend enforces this too).
        trigger: isExclusionRule ? ('Always' as const) : trigger,
        // Exclusion rules can't be activated/deactivated after saving, so they're always created active.
        isActive: isExclusionRule ? true : isActive,
        target,
      }
      if (isEdit) {
        await updateRule(rule.id, payload)
      }
      else {
        await addRule(payload)
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
      setRecursive(rule.recursive)
      setTrigger(rule.trigger ?? TRIGGER_TYPES[0])
      setConditions(rule.conditions)
      setActions(rule.actions)
    }
    else {
      setRuleName('')
      setIsActive(true)
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
              {!isExclusionRule && (
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
              )}

              <div className="flex items-center gap-4">
                {!isExclusionRule && (
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className={checkboxClass}
                    />
                    Active
                  </label>
                )}
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
                    onClick={() => setActions([...actions, isExclusionRule ? newExclusionAction() : newAction()])}
                    // An exclusion rule has at most one action per flag, so stop once every flag is used.
                    disabled={isExclusionRule && actions.length >= EXCLUSION_FLAGS.length}
                    className="text-xs font-semibold text-s1 hover:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Add Action
                  </button>
                </div>

                {isExclusionRule && (
                  <p className="text-xs text-s3 bg-s3/15 rounded-lg px-3 py-2">
                    This is an exclusion rule. Once saved it can't be edited, only deleted. Deleting it returns its
                    transactions to your budgets, bills, and reports.
                  </p>
                )}

                {actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={action.actionField}
                      onChange={(e) => {
                        const field = e.target.value as ActionField
                        // Each field's value means something different (a name, a category id, a flag), so changing the field clears it.
                        updateAction(i, {
                          actionField: field,
                          actionType: fieldmap.actions[field][0],
                          ...(field !== action.actionField ? { actionValue: '' } : {}),
                        })
                      }}
                      className={inputClass}
                    >
                      {fieldOptionsFor(i).map((f) => (
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

                    {action.actionField === 'Exclusion' ? (
                      <select
                        value={action.actionValue}
                        onChange={(e) => updateAction(i, { actionValue: e.target.value })}
                        className={inputClass}
                      >
                        <option value="" disabled>Exclude from...</option>
                        {EXCLUSION_FLAGS.map((flag) => (
                          // Each flag once per rule — the backend rejects duplicates.
                          <option
                            key={flag}
                            value={flag}
                            disabled={actions.some((a, ai) => ai !== i && a.actionField === 'Exclusion' && a.actionValue === flag)}
                          >
                            {flag}
                          </option>
                        ))}
                      </select>
                    ) : action.actionField === 'Category' ? (
                      // Shows category names, stores the category id, which is what SetAction and the validator expect.
                      <select
                        value={action.actionValue}
                        onChange={(e) => updateAction(i, { actionValue: e.target.value })}
                        className={inputClass}
                      >
                        <option value="" disabled>Select category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={action.actionValue}
                        onChange={(e) => updateAction(i, { actionValue: e.target.value })}
                        type="text"
                        placeholder="Value"
                        className={inputClass}
                      />
                    )}

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
