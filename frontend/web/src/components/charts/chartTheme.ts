// Shared Recharts theming — reads the app's CSS custom properties (index.css) so charts
// automatically follow the active dark/light theme without any chart-level logic.

export const CATEGORY_COLORS = [
  'var(--s1)',
  'var(--s2)',
  'var(--s3)',
  'var(--s4)',
  'var(--s5)',
  'var(--s6)',
  'var(--s7)',
  'var(--s8)',
]

export const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 10,
}
export const tooltipTextStyle = { color: 'var(--ink-2)' }
export const axisStyle = { fill: 'var(--ink-3)', fontSize: 11 }
export const gridStroke = 'var(--grid)'
export const baselineStroke = 'var(--base)'
export const legendStyle = { fontSize: 11, color: 'var(--ink-3)' }

export const selectClass =
  'bg-card border border-line rounded-lg text-xs text-ink-2 px-2 py-1 focus:outline-none focus:border-line-2'
