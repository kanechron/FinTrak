import { api } from './client'

export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string | null
  categoryDetailed: string | null
  categoryId: string | null
  categoryDetailedId: string | null
  pending: boolean
}

export interface TransactionAddPayload {
  merchantName: string
  amount: number
  date: string
  categoryId: string | null
  categoryDetailedId: string | null
  pending: boolean
}

export interface TransactionUpdatePayload {
  merchantName?: string
  amount?: number | null
  date?: string
  categoryId?: string | null
  categoryDetailedId?: string | null
}

/**
 * Get all transactions, optionally scoped to a date range
 * @param from - optional start date (inclusive), ISO format
 * @param to - optional end date (inclusive), ISO format
 * @returns transactions ordered by date descending
 * @throws {ApiError} if the request fails
 */
export function getTransactions(from?: string, to?: string): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (from != undefined) params.append('from', from.toString())
  if (to != undefined) params.append('to', to.toString())
  const query = params.toString()
  return api.get<Transaction[]>(`/transactions/get-transactions${query ? `?${query}` : ''}`)
}

/**
 * Get transactions belonging to a top-level category, optionally scoped to a date range
 * @param id - the top-level category's id
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns matching transactions
 * @throws {ApiError} if the request fails
 */
export function getTransactionsByCategory(
  id: string,
  from?: string,
  to?: string
): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(
    `/transactions/get-transactions-by-category/${id}${query ? `?${query}` : ''}`
  )
}

/**
 * Get transactions belonging to a detailed subcategory, optionally scoped to a date range
 * @remarks Distinct from {@link getTransactionsByCategory}, which filters by top-level category
 * @param id - the detailed subcategory's id
 * @param from - optional start date (inclusive)
 * @param to - optional end date (inclusive)
 * @returns matching transactions
 * @throws {ApiError} if the request fails
 */
export function getTransactionsByDetailedCategory(
  id: string,
  from?: string,
  to?: string
): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString()
  return api.get<Transaction[]>(
    `/transactions/get-transactions-by-detailed-category/${id}${query ? `?${query}` : ''}`
  )
}

/**
 * Create a new manual transaction
 * @param transaction - object of type `TransactionAddPayload`
 * @throws {ApiError} if the request fails
 */
export function addTransaction(transaction: TransactionAddPayload): Promise<void> {
  return api.post('/transactions/add-transaction', transaction)
}

/**
 * Upload a bank statement PDF for AI-assisted transaction extraction
 * @remarks Bypasses the shared `api` client — sends multipart form data directly via `fetch`
 * and throws a plain `Error` (not `ApiError`) on failure, unlike the rest of this module
 * @param pdf - the bank statement PDF file
 * @returns extracted transaction data; response shape is not yet strongly typed
 * @throws {Error} if the upload or extraction fails
 */
export async function parsePdf(pdf: File): Promise<unknown> {
  const form = new FormData()
  form.append('pdf', pdf)
  const res = await fetch('/api/transactions/import-pdf', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * Update an existing transaction
 * @param id - the transaction's id
 * @param transaction - partial object of type `TransactionUpdatePayload`; only included fields are updated
 * @throws {ApiError} if the request fails
 */
export function updateTransaction(
  id: string,
  transaction: TransactionUpdatePayload
): Promise<void> {
  return api.patch(`/transactions/update-transaction/${id}`, transaction)
}

/**
 * Delete a transaction
 * @param id - the transaction's id
 * @throws {ApiError} if the request fails
 */
export function deleteTransaction(id: string): Promise<void> {
  return api.delete(`/transactions/delete-transaction/${id}`)
}

/**
 * Bulk-assign a category to every transaction matching the given merchant name
 * @remarks Applies to all matching transactions, not a single transaction
 * @param merchantName - the merchant name to match against
 * @param categoryId - the category to apply, or `null` to clear it
 * @throws {ApiError} if the request fails
 */
export function applyCategoryByMerchant(
  merchantName: string,
  categoryId: string | null
): Promise<void> {
  return api.patch('/transactions/apply-category-by-merchant', { merchantName, categoryId })
}
