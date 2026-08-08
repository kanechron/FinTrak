/**
 * Format a signed dollar amount with an explicit +/- prefix
 * @remarks Does not interpret the sign itself — callers are responsible for passing the
 * correct value. FinTrak's display convention: positive renders as a debit (spent, shown
 * in red by consumers), negative as a credit (received, shown in green). Plaid's own sign
 * convention is the opposite of this, so callers often need to pass `-amount` rather than
 * a raw `Transaction.amount`.
 * @param amount - the signed amount to format
 * @returns a string like `"+$12.34"` or `"-$12.34"`
 */
export function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount < 0 ? `-$${abs}` : `+$${abs}`
}

/**
 * Convert a raw category name (e.g. Plaid's underscore-separated, uppercase format like
 * `"FOOD_AND_DRINK"`) into a display-friendly Title Case string (e.g. `"Food And Drink"`)
 * @param v - the raw category name
 * @returns the formatted, display-ready name
 */
export function formatCategoryName(v: string): string {
  return v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())
}
