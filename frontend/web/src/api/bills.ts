import { api } from './client'
import { type Transaction } from './transactions'

export interface Bill {
  id: string
  name: string
  displayName: string
  amount: number
  frequency: string
  dueDay: number | null
  customDate: string | null
  lastPaidDate: string | null
  nextDueDate: string | null
  isAutoPay: boolean
  categoryId: string | null
  category: string | null
  isAutoDetected: boolean
  status: string
}

export function getBills(): Promise<Bill[]> {
  return api.get<Bill[]>('/bills/get-bills')
}

export function getBillsHistory(id: string): Promise<Transaction[]> {
  return api.get<Transaction[]>(`/bills/get-bills-history?billId=${id}`)
}

export function addBill(
  bill: Partial<Omit<Bill, 'id' | 'category' | 'nextDueDate' | 'isAutoDetected'>>
): Promise<void> {
  return api.post('/bills/add-bill', bill)
}

export function updateBill(id: string, bill: Partial<Omit<Bill, 'id'>>): Promise<void> {
  return api.patch(`/bills/update-bill/${id}`, bill)
}

export function deleteBill(id: string): Promise<void> {
  return api.delete(`/bills/delete-bill/${id}`)
}
