interface Props {
  value: number
  max: number
  /** Tailwind background class, e.g. "bg-s1". Overrides the default status coloring (used for goals, not budgets). */
  color?: string
}

export default function ProgressBar({ value, max, color }: Props) {
  const pct = Math.min((value / max) * 100, 100)
  const statusColor = pct >= 100 ? 'bg-bad' : pct >= 80 ? 'bg-warn' : 'bg-good'
  return (
    <div className="w-full bg-raised rounded-full h-1.5">
      <div className={`${color ?? statusColor} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}
