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

/**
 * Get all bills {@link Bill}
 * @returns `Bill` type array of objects
 */
export function getBills(): Promise<Bill[]> {
  return api.get<Bill[]>('/bills/get-bills')
}

/**
 * Get transaction history matched to a bill by name and amount
 * @param id - the bill's id
 * @returns transactions matched to this bill, not the user's full transaction list
 * @throws {ApiError} if the request fails
 */
export function getBillsHistory(id: string): Promise<Transaction[]> {
  return api.get<Transaction[]>(`/bills/get-bills-history?billId=${id}`)
}

/**
 * Create a new bill
 * @remarks `id`, `category`, `nextDueDate`, and `isAutoDetected` fields omitted; remaining `Bill` fields are optional
 * @param bill - partial object of type `Bill`
 * @throws {ApiError} if the request fails
 */
export function addBill(
  bill: Partial<Omit<Bill, 'id' | 'category' | 'nextDueDate' | 'isAutoDetected'>>
): Promise<void> {
  return api.post('/bills/add-bill', bill)
}

/**
 * Update an existing bill
 * @param id - the bill's id
 * @param bill - partial object of type `Bill`; only included fields are updated
 * @throws {ApiError} if the request fails
 */
export function updateBill(id: string, bill: Partial<Omit<Bill, 'id'>>): Promise<void> {
  return api.patch(`/bills/update-bill/${id}`, bill)
}

/**
 * Delete a bill
 * @param id - the bill's id
 * @throws {ApiError} if the request fails
 */
export function deleteBill(id: string): Promise<void> {
  return api.delete(`/bills/delete-bill/${id}`)
}
