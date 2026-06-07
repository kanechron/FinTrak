import { api } from "./client"

export interface Bill {
    id: string
    name: string
    amount: number
    dueDate: string
    isRecurring: boolean
    categoryId: string | null
    category: string | null
    isAutoPay: boolean
    frequency: string | null
}

export function getBills(): Promise<Bill[]> {
    return api.get<Bill[]>('/bills/get-bills')
}

export function addBill(bill: Omit<Bill, 'id' | 'category'>): Promise<void> {
    return api.post('/bills/add-bill', bill)
} 

export function updateBill(id: string, bill: Partial<Omit<Bill, 'id'>>): Promise<void> {
    return api.patch(`/bills/update-bill/${id}`, bill)
}

export function deleteBill(id: string): Promise<void> {
    return api.delete(`/bills/delete-bill/${id}`)
}