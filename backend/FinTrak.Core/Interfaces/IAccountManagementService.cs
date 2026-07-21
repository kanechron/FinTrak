namespace FinTrak.Core.Interfaces;
    
    public interface IAccountManagementService 
    {
    Task<bool> DeleteAccount (Guid userId, CancellationToken ct = default);

    Task<bool> DeactivateAccount (Guid userId, CancellationToken ct = default);

    Task<List<string>> GetAccessTokens(Guid userId, CancellationToken ct = default);
        
    }
