/**
 * Truncate text to a maximum length, appending an ellipsis if shortened
 * @remarks When truncated, the returned string is `maxLength + 1` characters (the
 * truncated text plus the appended "…") — not capped at exactly `maxLength`.
 * @param text - the text to truncate
 * @param maxLength - the character count before truncation kicks in
 * @returns the original text if within `maxLength`, otherwise the truncated text with a trailing "…"
 */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '…' : text
}
