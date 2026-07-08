import { api } from "./client";

export const plaidApi = {
  getLinkToken: () => api.post<{ link_token: string }>("/plaid/link-token"),
  exchangeToken: (publicToken: string) =>
    api.post<{ item_id: string }>("/plaid/exchange-token", { publicToken }),
  sync: () => api.post<void>("/plaid/sync"),
};
