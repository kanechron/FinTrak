import { api } from './client'

export interface Transaction {
  id: string
  accountId: string
  amount: number
  merchantName: string
  date: string
  isPending: boolean
  categoryId: string | null
}

export const transactionsApi = {
  getAll: () => api.get<Transaction[]>('/transactions'),
}
