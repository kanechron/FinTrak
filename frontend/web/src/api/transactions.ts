import { api } from './client'

export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string | null
  categoryDetailed: string | null
  categoryId: string | null
  pending: boolean
}

export interface TransactionAddPayload {
  merchantName: string
  amount: number
  date: string
  categoryId: string | null
  pending: boolean
}

export interface TransactionUpdatePayload {
  merchantName?: string
  amount?: number | null
  date?: string
  categoryId?: string | null
}

export function getTransactions(): Promise<Transaction[]> {
  return api.get<Transaction[]>('/transactions/get-transactions')
}

export function getTransactionsByCategory(id: string): Promise<Transaction[]> {
  return api.get<Transaction[]>(`/transactions/get-transactions-by-category/${id}`)
}

export function addTransaction(transaction: TransactionAddPayload): Promise<void> {
  return api.post('transactions/add-transaction', transaction)
}

export function updateTransaction(id: string, transaction: TransactionUpdatePayload): Promise<void> {
  return api.patch(`transactions/update-transaction/${id}`, transaction)
}

export function deleteTransaction(id: string): Promise<void> {
  return api.delete(`transactions/delete-transaction/${id}`)
}

export function applyCategoryByMerchant(merchantName: string, categoryId: string | null): Promise<void> {
  return api.patch('transactions/apply-category-by-merchant', { merchantName, categoryId })
}
