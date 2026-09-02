import { api } from './client'

export type TargetType = 'Transaction'

export type TriggerType = 'Always' | 'OnSync'

export type Operator =
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'EQUALS'
  | 'CONTAINS'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'

export type ConditionField =
  | 'MerchantName'
  | 'Amount'
  | 'TransactionDate'
  | 'DayOfMonth'
  | 'DayOfWeek'
  | 'Month'

export type ActionField = 'Category' | 'MerchantName' | 'BudgetExclusion' | 'BillFlag'

export type ActionType = 'Set' | 'Exclude'

export interface Condition {
  groupId: string
  conditionField: ConditionField
  conditionOperator: Operator | null
  conditionValue: string
  not: boolean
}

export interface Action {
  actionField: ActionField
  actionType: ActionType
  actionValue: string
}

export interface Rule {
  id: string
  userId: string
  priority: number
  ruleName: string
  isActive: boolean
  recursive: boolean
  createdAt: string
  deletedAt: string | null
  target: TargetType | null
  trigger: TriggerType | null
  conditions: Condition[]
  actions: Action[]
}

/**
 * Get all rules for the current user
 * @returns array of all non soft-deleted rules
 */
export function getRules(): Promise<Rule[]> {
  return api.get<Rule[]>('/rules/get-rules')
}

/**
 * Get a single rule by id
 * @throws {ApiError} if the rule doesn't exist or isn't owned by the current user
 */
export function getRule(id: string): Promise<Rule> {
  return api.get<Rule>(`/rules/get-rule/${id}`)
}

/**
 * Create a new rule
 * @remarks 'id', 'userId', 'createdAt', 'deletedAt' are set server-side
 * @throws {ApiError} if Target is unset or (userId, target, priority) collides with an existing rule
 */
export function addRule(
  rule: Omit<Rule, 'id' | 'userId' | 'createdAt' | 'deletedAt'>
): Promise<{ message: string; id: string }> {
  return api.post('/rules/add-rule', rule)
}

/**
 * Soft-delete a rule
 * @throws {ApiError} if the rule doesn't exist or isn't owned by the current user
 */
export function deleteRule(id: string): Promise<{ message: string }> {
  return api.delete(`/rules/delete-rule/${id}`)
}
