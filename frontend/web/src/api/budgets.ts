import { api } from './client'


export interface Budget {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isRecurring: boolean
  spent: number
  period: string
  categoryId: string | null
  category: string | null
  amount: number
  recurringDate: string | null
}

/**
 * Get all budgets
 * @returns array of all non soft-deleted budgets
 */
export function getBudgets(): Promise<Budget[]> {
  return api.get<Budget[]>('/budgets/get-budgets')
}

/**
 * Create new budget item
 * @remark 'id', 'spent', and 'category' fields omitted
 * @param budget object of type Budget
 * @throws {ApiError} if the request fails 
 */
export function addBudget(budget: Omit<Budget, 'id' | 'spent' | 'category'>): Promise<void> {
  return api.post('/budgets/add-budget', budget)
}

/**
 * Update budget item
 * @remark 'id' and 'spent' fields optional
 * @param id string
 * @param budget object of type Budget
 * @throws {ApiError} if the request fails 
 */
export function updateBudget(
  id: string,
  budget: Partial<Omit<Budget, 'id' | 'spent'>>
): Promise<void> {
  return api.patch(`/budgets/update-budget/${id}`, budget)
}

/**
 * Delete budget item
 * @param id string
 * @throws {ApiError} if the request fails 
 */
export function deleteBudget(id: string): Promise<void> {
  return api.delete(`/budgets/delete-budget/${id}`)
}
