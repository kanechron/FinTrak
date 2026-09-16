import { api } from './client'

export type TargetType = 'Transaction' | 'Goal' | 'Budget' | 'Bill' | 'Report'

export const TRIGGER_TYPES = ['Always', 'OnSync'] as const
export type TriggerType = (typeof TRIGGER_TYPES)[number]

export const OPERATORS = [
  'GREATER_THAN',
  'LESS_THAN',
  'EQUALS',
  'CONTAINS',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN_OR_EQUAL',
  'IN',
] as const
export type Operator = (typeof OPERATORS)[number]

export const CONDITION_FIELDS = [
  'MerchantName',
  'Amount',
  'TransactionDate',
  'DayOfMonth',
  'DayOfWeek',
  'Month',
] as const
export type ConditionField = (typeof CONDITION_FIELDS)[number]

export const ACTION_FIELDS = ['Category', 'MerchantName', 'BudgetExclusion', 'BillFlag'] as const
export type ActionField = (typeof ACTION_FIELDS)[number]

export const ACTION_TYPES = ['Set', 'Exclude'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

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

export interface RuleFieldMapDto {
  conditions: Record<ConditionField, Operator[]>
  actions: Record<ActionField, ActionType[]>
}

export type FieldMap = Record<TargetType, RuleFieldMapDto>




/**
 * Get all rules for the current user
 * @returns array of all non soft-deleted rules
 */
export function getRules(): Promise<Rule[]> {
  return api.get<Rule[]>('/rules/get-rules')
}

/**
 * 
 * @param target 
 * @returns 
 */
export function getRulesByTarget(target: string): Promise<Rule[]> {
    return api.get<Rule[]>(`/rules/get-rules-by-target/${target}`)
}

/**
 * Get a single rule by id
 * @throws {ApiError} if the rule doesn't exist or isn't owned by the current user
 */
export function getRule(id: string): Promise<Rule> {
  return api.get<Rule>(`/rules/get-rule/${id}`)
}

export function getRuleFieldmap() : Promise<FieldMap> {
  return api.get<FieldMap>(`/rules/get-rule-field-map`)
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
 * 
 * @param id ID of the rule being updated
 * @param rule Entire rule object
 * @returns 
 */
export function updateRule(
    id: string,
    rule: Omit<Rule, 'id' | 'userId' | 'createdAt' | 'deletedAt'>
): Promise<{ message: string }> {
    return api.patch(`/rules/update-rule/${id}`, rule)
}

/**
 * Soft-delete a rule
 * @throws {ApiError} if the rule doesn't exist or isn't owned by the current user
 */
export function deleteRule(id: string): Promise<{ message: string }> {
  return api.delete(`/rules/delete-rule/${id}`)
}
