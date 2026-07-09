import { api } from './client'

export interface Account {
  id: string
  name: string
  type: string
  last4: string
  balance: number
}

export function getAccounts(): Promise<Account[]> {
  return api.get<Account[]>('/accounts/get-accounts')
}
