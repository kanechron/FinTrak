import { api } from './client'
import {type Transaction} from './transactions'

export interface CategorySpending {
  id: string
  name: string
  amount: number
}

export function getCategorySpending(from?: string, to?: string, categoryIds?: string[] | null) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  categoryIds?.forEach((id) => params.append('categoryIds', id))
  const query = params.toString()
  return api.get<CategorySpending[]>(`/reports/category-spending${query ? `?${query}` : ''}`)
}

export function getCategoryDetailSpending(categoryId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  params.append('categoryId', categoryId)
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  return api.get<{ id: string; name: string; amount: number }[]>(
    `/reports/category-detail-spending?${params.toString()}`
  )
}

export function getMonthlySpending(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<{ year: number; month: number; amount: number }[]>(
    `/reports/monthly-spending${query ? `?${query}` : ''}`
  )
}


export function getCashFlowTransactions(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(
    `/reports/cash-flow-transactions${query ? `?${query}` : ''}`)
}

export function getMonthlyTransactions(from?: string, to?: string)
{
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(
    `/reports/monthly-transactions${query ? `?${query}` : ''}`)
}

export interface CashFlow {
  year: number
  month: number
  income: number
  expenses: number
  net: number
}

export function getCashFlow(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<CashFlow[]>(`/reports/cash-flow${query ? `?${query}` : ''}`)
}
