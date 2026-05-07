namespace FinTrak.Core.Entities
{

/// <summary>
/// Represents a category for transactions in the system.
/// The Category entity contains information about the category, such as its name and whether it is a system-defined category or a user-defined category. System-defined categories are predefined by the application and cannot be modified by users, while user-defined categories can be created and customized by users to better organize their transactions.
/// <br/>
/// <br/>
/// 
/// <br/><strong>Id</strong>: A unique identifier for the category (GUID).
/// <br/><strong>Name</strong>: The name of the category.
/// <br/><strong>IsSystem</strong>: A boolean indicating whether the category is a system-defined category (true) or a user-defined category (false).
/// </summary>

 public class Category
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsSystem { get; set; } = true;

    }  
}