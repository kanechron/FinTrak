using System.Text.RegularExpressions;

namespace FinTrak.Core.Utilities
{
    public static partial class NormalizeNameUtil
    {
        public static string NormalizeName(this string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            string cleaned = RemoveNonAlphanumericRegex().Replace(input, "");
            cleaned = CollapseWhitespaceRegex().Replace(cleaned, " ").Trim();
            return cleaned.ToLower();
        }

        [GeneratedRegex(@"[^a-zA-Z0-9\s]")]
        private static partial Regex RemoveNonAlphanumericRegex();

        [GeneratedRegex(@"\s+")]
        private static partial Regex CollapseWhitespaceRegex();
    }
}
