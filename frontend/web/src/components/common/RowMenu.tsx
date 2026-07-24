import { useState, useRef, useEffect } from 'react'
import { KebabIcon } from './icons'

interface RowMenuAction {
  label: string
  onClick: () => void
  danger?: boolean
}

interface Props {
  actions: RowMenuAction[]
  ariaLabel?: string
}

export default function RowMenu({ actions, ariaLabel = 'More options' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-label={ariaLabel}
        className="text-ink-3 hover:text-ink-2 transition-colors p-1"
      >
        <KebabIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 bg-card border border-line rounded-xl shadow-xl overflow-hidden p-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                a.onClick()
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                a.danger ? 'text-bad hover:bg-bad/10' : 'text-ink-2 hover:bg-raised hover:text-ink'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
