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

export function getTransactions(from?: string, to?: string): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (from != undefined) params.append('from', from.toString())
  if (to != undefined) params.append('to', to.toString())
  const query = params.toString()
  return api.get<Transaction[]>(`/transactions/get-transactions${query ? `?${query}` : ''}`)
}

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

export function addTransaction(transaction: TransactionAddPayload): Promise<void> {
  return api.post('/transactions/add-transaction', transaction)
}

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

export function updateTransaction(
  id: string,
  transaction: TransactionUpdatePayload
): Promise<void> {
  return api.patch(`/transactions/update-transaction/${id}`, transaction)
}

export function deleteTransaction(id: string): Promise<void> {
  return api.delete(`/transactions/delete-transaction/${id}`)
}

export function applyCategoryByMerchant(
  merchantName: string,
  categoryId: string | null
): Promise<void> {
  return api.patch('/transactions/apply-category-by-merchant', { merchantName, categoryId })
}
