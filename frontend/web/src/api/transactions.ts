import { api } from './client'

export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  pending: boolean
}

export function getTransactions(): Promise<Transaction[]> {
  return api.get<Transaction[]>('/transactions')
}
