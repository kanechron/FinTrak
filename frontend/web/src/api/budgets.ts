import { api } from './client'

export interface Budget {
  category: string
  spent: number
  limit: number
}

export function getBudgets(): Promise<Budget[]> {
  return api.get<Budget[]>('/budgets')
}