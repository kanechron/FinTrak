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

        public static string NormalizeForBillDetection(this string? input, string name)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            string result = input.NormalizeName();

            // Strip ACH prefix
            result = Regex.Replace(result, @"^ach transaction\s*", "");

            // Strip NFCU-style "pos debit visa check card 1744" prefix
            result = Regex.Replace(result, @"^pos\s+debit\s+(visa|mastercard|mc|amex|discover)?\s*(check\s*card|debit\s*card|credit\s*card|checkcard)\s*\d{4}\s*", "");
            // Strip generic card prefix (visa/mc/etc + card type + last-4)
            result = Regex.Replace(result, @"^(pos\s+)?(visa|mastercard|mc|amex|discover)?\s*(check\s*card|debit\s*card|credit\s*card|checkcard)\s*\d{4}\s*", "");

            // Strip digital payment app prefix and suffix
            result = Regex.Replace(result, @"^(zelle|paypal|venmo|cash\s*app|apple\s*pay|google\s*pay|samsung\s*pay)\s*(hard\s*post|transfer|payment|db|credit|debit)?\s*", "");
            result = Regex.Replace(result, @"\s*(zelle|paypal|venmo|cash\s*app|apple\s*pay|google\s*pay|samsung\s*pay)\s*(debit|credit|transfer|payment)?$", "");

            // Strip deposit/transfer/dividend prefixes
            result = Regex.Replace(result, @"^deposit\s*", "");
            result = Regex.Replace(result, @"^(transfer)\s*(to|from)\s*", "");
            result = Regex.Replace(result, @"^dividend\s*", "");

            // Strip international transaction fee (prefix and suffix)
            result = Regex.Replace(result, @"^(intl|international)\s*transaction\s*fee\s*", "");
            result = Regex.Replace(result, @"\s*(intl|international)\s*transaction\s*fee$", "");

            // Strip ACH debit/credit suffix
            result = Regex.Replace(result, @"\s*ach\s*(debit|credit)$", "");

            // Strip POS transaction suffix
            result = Regex.Replace(result, @"\s*pos\s*transaction$", "");

            // Strip Bank of America descriptor noise
            result = Regex.Replace(result, @"\s*(des|id|indn|co\s*id)\s*:.*", "");

            // Strip trailing reference numbers (8+ digits)
            result = Regex.Replace(result, @"\s*\d{8,}\s*$", "");

            // Strip embedded personal name (full span: first token through last token)
            string[] arr = name.NormalizeName().Split(' ');
            if (arr.Length >= 2)
                result = Regex.Replace(result, @$"\b{Regex.Escape(arr[0])}\b.*?\b{Regex.Escape(arr[^1])}\b", "");
            // Strip trailing last-name token (e.g. "ii" appended by NFCU for suffix cardholders)
            result = Regex.Replace(result, @"\b(ii|iii|iv|jr|sr)\b\s*$", "");

            

            // Remove duplicate consecutive tokens
            result = Regex.Replace(result, @"\b(\w+)\b(?:\s+\1)+\b", "$1");

            return result.Trim();
        }
    }
}
