import { api } from './client'
import { type Transaction } from './transactions'

export interface CategorySpending {
  id: string
  name: string
  amount: number
}

/**
 * Get total spending grouped by top-level category
 * @remarks Excludes transfers and income (transfers *from* other apps are still counted)
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @param categoryIds - optional list of top-level category ids to restrict results to
 * @returns spending totals per category
 * @throws {ApiError} if the request fails
 */
export function getCategorySpending(from?: string, to?: string, categoryIds?: string[] | null) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  categoryIds?.forEach((id) => params.append('categoryIds', id))
  const query = params.toString()
  return api.get<CategorySpending[]>(`/reports/category-spending${query ? `?${query}` : ''}`)
}

/**
 * Get total spending grouped by detailed subcategory, within one top-level category
 * @remarks Excludes transfers and income, same rules as {@link getCategorySpending}
 * @param categoryId - the top-level category's id
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns spending totals per subcategory
 * @throws {ApiError} if the request fails
 */
export function getCategoryDetailSpending(categoryId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  params.append('categoryId', categoryId)
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  return api.get<{ id: string; name: string; amount: number }[]>(
    `/reports/category-detail-spending?${params.toString()}`
  )
}

/**
 * Get total expenses per month
 * @remarks Excludes transfers and income; uncategorized transactions are still included
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns monthly spending totals
 * @throws {ApiError} if the request fails
 */
export function getMonthlySpending(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<{ year: number; month: number; amount: number }[]>(
    `/reports/monthly-spending${query ? `?${query}` : ''}`
  )
}

/**
 * Get all transactions (income and expenses) for a given date range
 * @remarks Unlike the spending-report endpoints, transfers and income are not filtered out here
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns matching transactions
 * @throws {ApiError} if the request fails
 */
export function getCashFlowTransactions(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(`/reports/cash-flow-transactions${query ? `?${query}` : ''}`)
}

/**
 * Get expense transactions for a given date range
 * @remarks Excludes transfers and income, unlike {@link getCashFlowTransactions}
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns matching transactions
 * @throws {ApiError} if the request fails
 */
export function getMonthlyTransactions(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(`/reports/monthly-transactions${query ? `?${query}` : ''}`)
}

export interface CashFlow {
  year: number
  month: number
  income: number
  expenses: number
  net: number
}

/**
 * Get income vs. expenses per month
 * @remarks Transfers are not filtered out — offsetting debits and credits cancel out naturally
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns monthly income, expenses, and net totals
 * @throws {ApiError} if the request fails
 */
export function getCashFlow(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<CashFlow[]>(`/reports/cash-flow${query ? `?${query}` : ''}`)
}

export interface LTEForecastingResponse {
  categories: LTEData[]
  insufficientCategories: LTEInsufficientData[]
}

export interface LTEData {
  category: string
  categoryId: string
  dataPoints: LTEDataPoint[]
  projection: LTEDataPoint
  projectionConfidence: string
  percentChange: number
  dollarChange: number
  deviationLabel: string
}

export interface LTEInsufficientData {
  categoryId: string
}

export interface LTEDataPoint {
  monthlySum: number
  month: string
}

export function getLTERegression() {
  return api.get<LTEForecastingResponse>(`/reports/lte-forecasting`)
}
