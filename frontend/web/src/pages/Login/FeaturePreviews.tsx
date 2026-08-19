// Small hand-drawn SVG "screenshot" illustrations for the Login page's Features section.
// Wireframe-style previews (not real screenshots) that use the app's own color tokens
// so they stay in sync with the live theme.
import type { ReactNode } from 'react'

function Frame({
  children,
  className = 'w-full h-auto',
  width = 240,
}: {
  children: ReactNode
  className?: string
  width?: number
}) {
  return (
    <svg viewBox={`0 0 ${width} 150`} className={className}>
      <rect
        x="0.5"
        y="0.5"
        width={width - 1}
        height="149"
        rx="12"
        fill="var(--card)"
        stroke="var(--line)"
      />
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
      <path
        d="M20 26a4 4 0 0 1 7-2.6M28 26a4 4 0 0 1-7 2.6"
        stroke="white"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="40" y="21" width="70" height="6" rx="3" fill="var(--ink-3)" />
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20, ${52 + i * 26})`}>
          <rect x="0" y="0" width={r.name} height="7" rx="3" fill="var(--ink-2)" />
          <rect x="0" y="11" width={r.meta} height="5" rx="2.5" fill="var(--ink-3)" opacity="0.6" />
          <rect
            x={200 - r.bal - 20}
            y="2"
            width={r.bal}
            height="8"
            rx="4"
            fill={r.color}
            opacity="0.8"
          />
        </g>
      ))}
    </Frame>
  )
}

// Describes an SVG arc path (stroked, not filled) between two angles in degrees,
// measured clockwise from 12 o'clock.
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
}

export function ReportsPreview() {
  const segs = [
    { pct: 0.4, color: 'var(--s1)' },
    { pct: 0.25, color: 'var(--s2)' },
    { pct: 0.2, color: 'var(--s3)' },
    { pct: 0.15, color: 'var(--s5)' },
  ]
  let cum = 0
  return (
    <Frame>
      <g>
        {segs.map((s, i) => {
          const startAngle = cum * 360
          const endAngle = (cum + s.pct) * 360
          cum += s.pct
          return (
            <path
              key={i}
              d={arcPath(62, 75, 32, startAngle, endAngle)}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
            />
          )
        })}
      </g>
      <g transform="translate(122, 40)">
        {segs.map((s, i) => (
          <g key={i} transform={`translate(0, ${i * 22})`}>
            <rect width="8" height="8" rx="2" fill={s.color} />
            <rect
              x="14"
              y="1.5"
              width={70 - i * 8}
              height="5"
              rx="2.5"
              fill="var(--ink-3)"
              opacity="0.7"
            />
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

export function ImportPreview() {
  const rows = [{ name: 56 }, { name: 48 }, { name: 60 }]
  return (
    <Frame>
      {/* statement document with a folded corner */}
      <path
        d="M44 40h38l16 16v54a2 2 0 0 1-2 2H44a2 2 0 0 1-2-2V42a2 2 0 0 1 2-2z"
        fill="var(--raised)"
        stroke="var(--line)"
      />
      <path d="M82 40v16a2 2 0 0 0 2 2h14" fill="none" stroke="var(--line)" />
      <rect x="49" y="67" width="32" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.7" />
      <rect x="49" y="78" width="27" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />
      <rect x="49" y="89" width="30" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />

      {/* flow arrow */}
      <path
        d="M110 75h18m0 0l-6-6m6 6l-6 6"
        stroke="var(--s1)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* extracted transactions */}
      {rows.map((r, i) => (
        <g key={i} transform={`translate(140, ${46 + i * 26})`}>
          <rect width={r.name} height="7" rx="3" fill="var(--ink-2)" />
        </g>
      ))}
    </Frame>
  )
}

export function BillsPreview() {
  const rows = [
    { name: 50, amt: 34 },
    { name: 42, amt: 30 },
    { name: 46, amt: 32 },
  ]
  return (
    <Frame>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20, ${28 + i * 38})`}>
          <rect width={r.name} height="7" rx="3" fill="var(--ink-2)" />
          <rect y="11" width={r.amt} height="5" rx="2.5" fill="var(--ink-3)" opacity="0.6" />
          <rect
            x="150"
            y="1"
            width="32"
            height="12"
            rx="6"
            fill="none"
            stroke="var(--good)"
            strokeWidth="1.2"
          />
          <rect
            x="188"
            y="1"
            width="24"
            height="12"
            rx="6"
            fill="none"
            stroke="var(--ink-3)"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>
      ))}
    </Frame>
  )
}

export function LTEForecastPreview() {
  return (
    <>
      {/* Below `sm` the grid drops to one column, so this card renders at the same width
          as every other card — needs the same 240-wide viewBox as them, not the 480-wide
          one meant for the two-column desktop layout. viewBox can't respond to a CSS
          breakpoint on its own, so render both and let Tailwind swap which is visible. */}
      <div className="sm:hidden">
        <Frame>
          <polyline
            points="15,70 32.5,85 50,78 67.5,60 85,72 102.5,65"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="102.5,65 122.5,75"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <polyline
            points="15,95 32.5,100 50,92 67.5,100 85,95 102.5,100"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="102.5,100 122.5,95"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <polyline
            points="15,102 32.5,90 50,97 67.5,70 85,80 102.5,55"
            fill="none"
            stroke="var(--s1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="102.5,55 122.5,30"
            fill="none"
            stroke="var(--s1)"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <circle cx="122.5" cy="30" r="3" fill="none" stroke="var(--s1)" strokeWidth="1.6" />

          <line x1="13" y1="112" x2="127.5" y2="112" stroke="var(--line)" strokeWidth="1" />

          <g transform="translate(150, 44)">
            <rect width="8" height="8" rx="2" fill="var(--s1)" />
            <rect x="14" y="1.5" width="60" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.7" />
          </g>
          <g transform="translate(150, 66)">
            <rect width="8" height="8" rx="2" fill="var(--ink-3)" opacity="0.4" />
            <rect x="14" y="1.5" width="48" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />
          </g>
          <g transform="translate(150, 88)">
            <rect width="8" height="8" rx="2" fill="var(--ink-3)" opacity="0.4" />
            <rect x="14" y="1.5" width="54" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />
          </g>
        </Frame>
      </div>

      <div className="hidden sm:block">
        <Frame width={480}>
          {/* ghosted (unlocked) categories, drawn first so the active line sits on top */}
          <polyline
            points="30,70 65,85 100,78 135,60 170,72 205,65"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="205,65 245,75"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <polyline
            points="30,95 65,100 100,92 135,100 170,95 205,100"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="205,100 245,95"
            fill="none"
            stroke="var(--ink-3)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* historical trend (solid) */}
          <polyline
            points="30,102 65,90 100,97 135,70 170,80 205,55"
            fill="none"
            stroke="var(--s1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* projected month (dashed) */}
          <polyline
            points="205,55 245,30"
            fill="none"
            stroke="var(--s1)"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <circle cx="245" cy="30" r="3" fill="none" stroke="var(--s1)" strokeWidth="1.6" />

          <line x1="26" y1="112" x2="255" y2="112" stroke="var(--line)" strokeWidth="1" />

          {/* category list, one locked (colored) and two not (ghosted) — matches the three lines above */}
          <g transform="translate(300, 44)">
            <rect width="8" height="8" rx="2" fill="var(--s1)" />
            <rect x="14" y="1.5" width="80" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.7" />
          </g>
          <g transform="translate(300, 66)">
            <rect width="8" height="8" rx="2" fill="var(--ink-3)" opacity="0.4" />
            <rect x="14" y="1.5" width="60" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />
          </g>
          <g transform="translate(300, 88)">
            <rect width="8" height="8" rx="2" fill="var(--ink-3)" opacity="0.4" />
            <rect x="14" y="1.5" width="70" height="5" rx="2.5" fill="var(--ink-3)" opacity="0.5" />
          </g>
        </Frame>
      </div>
    </>
  )
}

export function GoalsPreview() {
  const rows = [
    { label: 58, pct: 0.8, color: 'var(--s1)' },
    { label: 46, pct: 0.4, color: 'var(--s2)' },
    { label: 50, pct: 0.6, color: 'var(--s5)' },
  ]
  return (
    <Frame>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(31, ${28 + i * 40})`}>
          <circle cx="-8" cy="3.5" r="2" fill="var(--ink-3)" />
          <circle cx="-8" cy="10.5" r="2" fill="var(--ink-3)" />
          <rect x="6" width={r.label} height="7" rx="3" fill="var(--ink-2)" />
          <rect x="6" y="16" width="180" height="6" rx="3" fill="var(--raised)" />
          <rect x="6" y="16" width={180 * r.pct} height="6" rx="3" fill={r.color} />
        </g>
      ))}
    </Frame>
  )
}
