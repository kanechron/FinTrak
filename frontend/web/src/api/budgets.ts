import { api } from './client'

export interface Budget {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isRecurring: boolean
  spent: number
  period: string
  // category: string
  amount: number
}

export function getBudgets(): Promise<Budget[]> {
  return api.get<Budget[]>('/budgets/get-budgets')
}

export function addBudget(budget: Omit<Budget, 'id' | 'spent'>): Promise<void> {
  return api.post('/budgets/add-budget', budget)
}

export function updateBudget(budget: Omit<Budget, 'id' | 'spent'>): Promise<void> {
  return api.patch('/budgets/update-budget', budget)
}

export function deleteBudget(id: string): Promise<void> {
  return api.delete(`/budgets/delete-budget/${id}`)
}