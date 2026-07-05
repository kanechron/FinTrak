import { api } from "./client"

export interface Bill {
    id: string
    name: string
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

export interface TransactionGroup {
  merchantName: string
  count: number
  amounts: (number | null)[]
  dates: (string | null)[]
  category: string | null
  categoryId: string | null
}

export function getBills(): Promise<Bill[]> {
    return api.get<Bill[]>('/bills/get-bills')
}

export function getSuggestions(): Promise<TransactionGroup[][]> {
  return api.get<TransactionGroup[][]>('/bills/get-suggestions')
}

export function addBill(bill: Omit<Bill, 'id' | 'category' | 'nextDueDate' | 'isAutoDetected'>): Promise<void> {
    return api.post('/bills/add-bill', bill)
}

export function updateBill(id: string, bill: Partial<Omit<Bill, 'id'>>): Promise<void> {
    return api.patch(`/bills/update-bill/${id}`, bill)
}

export function deleteBill(id: string): Promise<void> {
    return api.delete(`/bills/delete-bill/${id}`)
}

export function markBillPaid(id: string): Promise<void> {
    return api.post(`/bills/mark-paid/${id}`, {})
}
