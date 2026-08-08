import { api } from './client'

export interface PlaidItemSummary {
  id: string
  institutionName: string
  status: string
}

export const plaidApi = {
  /**
   * Create a Plaid Link token, used to initialize the frontend Link widget for connecting a new bank
   * @throws {ApiError} if the request fails
   */
  getLinkToken: () => api.post<{ link_token: string }>('/plaid/link-token'),

  /**
   * Exchange a public token from a completed Plaid Link flow for a permanent access token
   * @remarks Idempotent — safe to call again for an institution that's already linked
   * @param publicToken - the public token returned by the Plaid Link widget
   * @throws {ApiError} if the request fails
   */
  exchangeToken: (publicToken: string) =>
    api.post<{ item_id: string }>('/plaid/exchange-token', { publicToken }),

  /**
   * Trigger a cursor-based sync of transactions (added/modified/removed) and refresh account balances
   * @throws {ApiError} if the request fails
   */
  sync: () => api.post<void>('/plaid/sync'),

  /**
   * Get the user's linked bank connections
   * @throws {ApiError} if the request fails
   */
  getItems: () => api.get<PlaidItemSummary[]>('/plaid/items'),

  /**
   * Remove a linked bank connection
   * @param plaidItemId - the id of the `PlaidItem` to unlink
   * @throws {ApiError} if the request fails
   */
  unlink: (plaidItemId: string) => api.delete<void>(`/plaid/unlink/${plaidItemId}`),
}
