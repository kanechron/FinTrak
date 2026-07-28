// Appends T00:00:00 to plain date strings (e.g. "2026-05-30") to force local
// time parsing. Without it, new Date("2026-05-30") parses as UTC midnight and
// toLocaleDateString shifts it back by the timezone offset.
export function formatDate(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date.includes('T') ? date : date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Converts a Date to a plain "YYYY-MM-DD" string, for API params and <input type="date"> values.
export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}
