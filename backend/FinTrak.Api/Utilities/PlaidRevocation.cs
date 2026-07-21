using Going.Plaid;

namespace FinTrak.Api.Utilities
{
    /// <summary>
    /// Shared logic for revoking a Plaid access token. Treats an already-revoked
    /// item (ITEM_NOT_FOUND) as success, since the desired end state — no live
    /// Plaid connection — is already true in that case.
    /// </summary>
    public static class PlaidRevocation
    {
        public static async Task RevokeItemAsync(PlaidClient plaid, string accessToken)
        {
            var response = await plaid.ItemRemoveAsync(new Going.Plaid.Item.ItemRemoveRequest
            {
                AccessToken = accessToken
            });

            if (response.Error != null && response.Error.ErrorCode != "ITEM_NOT_FOUND")
            {
                throw new Exception($"Failed to remove Plaid item: {response.Error.ErrorMessage}");
            }
        }
    }
}
