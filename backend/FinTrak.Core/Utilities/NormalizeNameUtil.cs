using System.Text.RegularExpressions;

namespace FinTrak.Core.Utilities
{
    public static class NormalizeNameUtil
    {
        public static string NormalizeName(this string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            string cleaned = Regex.Replace(input, @"[^a-zA-Z0-9\s]", "");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
            return cleaned.ToLower();
        }
    }
}
