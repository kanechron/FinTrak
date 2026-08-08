import { api } from './client'

export interface Account {
  id: string
  name: string
  type: string
  last4: string
  balance: number
}

/**
 * Get the user's linked bank accounts
 * @returns active accounts only; unlinked/removed accounts are excluded
 * @throws {ApiError} if the request fails
 */
export function getAccounts(): Promise<Account[]> {
  return api.get<Account[]>('/accounts/get-accounts')
}
