

using System.Threading.Channels;
using FinTrak.Core.Entities;
using FinTrak.Core.Interfaces.Services;

namespace FinTrak.Infrastructure.Services;

public class EmailSenderService
{
    public static async Task SendEmail(Notification x)
    {
        Console.WriteLine(string.Empty);
    }
}