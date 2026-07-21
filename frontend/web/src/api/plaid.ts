import { api } from './client'

export interface PlaidItemSummary {
  id: string
  institutionName: string
  status: string
}

export const plaidApi = {
  getLinkToken: () => api.post<{ link_token: string }>('/plaid/link-token'),
  exchangeToken: (publicToken: string) =>
    api.post<{ item_id: string }>('/plaid/exchange-token', { publicToken }),
  sync: () => api.post<void>('/plaid/sync'),
  getItems: () => api.get<PlaidItemSummary[]>('/plaid/items'),
  unlink: (plaidItemId: string) => api.delete<void>(`/plaid/unlink/${plaidItemId}`),
}
