
namespace FinTrak.Core.Entities
{
    
    public class Invite
    {
        public Guid Id {get; set;} = Guid.NewGuid();
        public Guid Token {get; set;} = Guid.NewGuid();
        /// <summary>
        /// Time of token creation
        /// </summary>
        public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
        /// <summary>
        /// Expiration of token from time of creation plus 48 hours
        /// </summary>
        public DateTime ExpiresAt {get; set;} = DateTime.UtcNow.AddDays(2);
        /// <summary>
        /// DateTime of token submission
        /// </summary>
        public DateTime? UsedAt {get; set;} = null;
        /// <summary>
        /// User that uses this token, defined by UserID
        /// </summary>
        public Guid? UsedByUserId {get; set;} = null;
    }
}