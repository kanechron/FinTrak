/**
 * Parse an ISO date string as local time, avoiding the UTC-midnight shift
 * @remarks Appends `T00:00:00` to plain date-only strings (e.g. `"2026-05-30"`) to force
 * local time parsing. Without it, `new Date("2026-05-30")` parses as UTC midnight, and
 * any local-timezone formatting (`toLocaleDateString`, etc.) shifts it back by the local
 * timezone offset — often landing on the *previous* day for users west of UTC.
 * @param date - an ISO date string (date-only or with a time component)
 * @returns a `Date` safe to format in the local timezone without a day shift
 */
export function parseLocalDate(date: string): Date {
  return new Date(date.includes('T') ? date : date + 'T00:00:00')
}

/**
 * Format a date string for display (e.g. `"May 30, 2026"`)
 * @param date - an ISO date string (date-only or with a time component), or `null`
 * @returns the formatted date, or `"—"` if `date` is `null`
 */
export function formatDate(date: string | null): string {
  if (!date) return '—'
  return parseLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
