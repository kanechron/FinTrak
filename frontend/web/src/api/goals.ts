import { api } from './client'

export interface Goal {
  id: string
  name: string
  targetAmount: number | null
  currentAmount: number
  targetDate: string | null
  isActive: boolean
  priority: number
  linkedAccounts: { id: string; name: string; mask: string }[]
}

/**
 * Get all savings goals
 * @returns array of the user's goals
 * @throws {ApiError} if the request fails
 */
export function getGoals() {
  return api.get<Goal[]>('/goals/get-goals')
}

export type GoalRequest = Omit<Goal, 'id' | 'linkedAccounts'> & { linkedAccounts: { id: string }[] }

/**
 * Create a new savings goal
 * @remarks `linkedAccounts` only requires each account's `id`; the goal's own `id` is server-assigned
 * @param goal - object of type `GoalRequest`
 * @returns the newly created goal, including its server-assigned `id`
 * @throws {ApiError} if the request fails
 */
export function addGoal(goal: GoalRequest) {
  return api.post<Goal>('/goals/add-goal', goal)
}

/**
 * Update an existing savings goal
 * @param id - the goal's id
 * @param updates - partial object of type `Goal`; only included fields are updated
 * @returns the updated goal
 * @throws {ApiError} if the request fails
 */
export function updateGoal(id: string, updates: Partial<Omit<Goal, 'id'>>) {
  return api.patch<Goal>(`/goals/update-goal/${id}`, updates)
}

/**
 * Delete a savings goal
 * @param id - the goal's id
 * @throws {ApiError} if the request fails
 */
export function deleteGoal(id: string): Promise<void> {
  return api.delete(`/goals/delete-goal/${id}`)
}
