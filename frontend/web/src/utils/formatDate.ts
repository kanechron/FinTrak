/**
 * Format a date string for display (e.g. `"May 30, 2026"`)
 * @remarks Appends `T00:00:00` to plain date-only strings (e.g. `"2026-05-30"`) to force
 * local time parsing. Without it, `new Date("2026-05-30")` parses as UTC midnight, and
 * `toLocaleDateString` shifts it back by the local timezone offset — often landing on
 * the *previous* day for users west of UTC.
 * @param date - an ISO date string (date-only or with a time component), or `null`
 * @returns the formatted date, or `"—"` if `date` is `null`
 */
export function formatDate(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date.includes('T') ? date : date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Convert a Date to a plain `"YYYY-MM-DD"` string, for API params and `<input type="date">` values
 * @remarks `toISOString()` converts through UTC internally — for a local Date near midnight,
 * this can shift the extracted date by one day depending on the user's timezone offset,
 * the same underlying issue {@link formatDate} works around in the opposite direction.
 * @param d - the Date to convert
 * @returns a date-only string, e.g. `"2026-05-30"`
 */
export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}
