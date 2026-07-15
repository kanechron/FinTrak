// Small hand-drawn SVG "screenshot" illustrations for the Login page's Features section.
// Wireframe-style previews (not real screenshots) that use the app's own color tokens
// so they stay in sync with the live theme.
import type { ReactNode } from 'react'

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 150" className="w-full h-auto">
      <rect x="0.5" y="0.5" width="239" height="149" rx="12" fill="var(--card)" stroke="var(--line)" />
      {children}
    </svg>
  )
}

export function SyncPreview() {
  const rows = [
    { name: 60, meta: 40, bal: 44, color: 'var(--ink-2)' },
    { name: 50, meta: 34, bal: 44, color: 'var(--ink-2)' },
    { name: 44, meta: 30, bal: 40, color: 'var(--bad)' },
  ]
  return (
    <Frame>
      <circle cx="24" cy="26" r="9" fill="var(--s1)" />
      <path d="M20 26a4 4 0 0 1 7-2.6M28 26a4 4 0 0 1-7 2.6" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <rect x="40" y="21" width="70" height="6" rx="3" fill="var(--ink-3)" />
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20, ${52 + i * 26})`}>
          <rect x="0" y="0" width={r.name} height="7" rx="3" fill="var(--ink-2)" />
          <rect x="0" y="11" width={r.meta} height="5" rx="2.5" fill="var(--ink-3)" opacity="0.6" />
          <rect x={200 - r.bal - 20} y="2" width={r.bal} height="8" rx="4" fill={r.color} opacity="0.8" />
        </g>
      ))}
    </Frame>
  )
}

export function ReportsPreview() {
  const C = 2 * Math.PI * 32
  const segs = [
    { pct: 0.4, color: 'var(--s1)' },
    { pct: 0.25, color: 'var(--s2)' },
    { pct: 0.2, color: 'var(--s3)' },
    { pct: 0.15, color: 'var(--s5)' },
  ]
  let cum = 0
  return (
    <Frame>
      <g transform="rotate(-90 62 75)">
        {segs.map((s, i) => {
          const seg = s.pct * C
          const offset = -cum * C
          cum += s.pct
          return (
            <circle
              key={i}
              cx="62"
              cy="75"
              r="32"
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${seg} ${C - seg}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </g>
      <g transform="translate(122, 40)">
        {segs.map((s, i) => (
          <g key={i} transform={`translate(0, ${i * 22})`}>
            <rect width="8" height="8" rx="2" fill={s.color} />
            <rect x="14" y="1.5" width={70 - i * 8} height="5" rx="2.5" fill="var(--ink-3)" opacity="0.7" />
          </g>
        ))}
      </g>
    </Frame>
  )
}

export function BudgetsPreview() {
  const rows = [
    { label: 54, pct: 0.82, color: 'var(--warn)' },
    { label: 62, pct: 1, color: 'var(--bad)' },
    { label: 48, pct: 0.45, color: 'var(--good)' },
  ]
  return (
    <Frame>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20, ${28 + i * 34})`}>
          <rect width={r.label} height="7" rx="3" fill="var(--ink-2)" />
          <rect y="14" width="200" height="6" rx="3" fill="var(--raised)" />
          <rect y="14" width={200 * r.pct} height="6" rx="3" fill={r.color} />
        </g>
      ))}
    </Frame>
  )
}

export function GoalsPreview() {
  const rows = [
    { label: 58, pct: 0.8, color: 'var(--s1)' },
    { label: 46, pct: 0.4, color: 'var(--s2)' },
  ]
  return (
    <Frame>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20, ${34 + i * 44})`}>
          <circle cx="-8" cy="3.5" r="2" fill="var(--ink-3)" />
          <circle cx="-8" cy="10.5" r="2" fill="var(--ink-3)" />
          <rect x="6" width={r.label} height="7" rx="3" fill="var(--ink-2)" />
          <rect x="6" y="16" width="180" height="6" rx="3" fill="var(--raised)" />
          <rect x="6" y="16" width={180 * r.pct} height="6" rx="3" fill={r.color} />
        </g>
      ))}
      <circle cx="196" cy="112" r="14" fill="var(--good)" opacity="0.15" />
      <path d="M190 112l4 4 8-8" stroke="var(--good)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,0)" />
    </Frame>
  )
}
