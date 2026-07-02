using FinTrak.Core.Entities;

namespace FinTrak.Core.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync();
}
