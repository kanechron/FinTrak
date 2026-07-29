import React, { useEffect } from 'react'

export interface ToastData {
  id: string
  type: 'success' | 'error'
  title: string
  content: string
  duration?: number
}

// `destroy` isn't part of ToastData because it can't survive JSON.stringify —
// ToastProvider persists ToastData to sessionStorage and computes destroy per-render instead.
interface ToastProps extends ToastData {
  destroy: () => void
}

const Toast: React.FC<ToastProps> = (props) => {
  const { destroy, content, title, duration = 4000, type } = props

  // Self-clearing: each toast owns its own timer and removes only itself, so multiple
  // toasts on screen at once don't interfere with each other's lifetimes.
  useEffect(() => {
    if (!duration) return

    const timer = setTimeout(() => {
      destroy()
    }, duration)

    return () => clearTimeout(timer)
  }, [destroy, duration])

  const borderClass = type === 'success' ? 'border-good' : 'border-bad'

  return (
    <div
      className={`bg-card border border-line border-l-4 ${borderClass} rounded-lg shadow-lg p-3 w-72`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <button
          onClick={destroy}
          aria-label="Dismiss"
          className="text-ink-3 hover:text-ink transition-colors text-sm leading-none cursor-pointer"
        >
          ✕
        </button>
      </div>
      {content && <p className="text-xs text-ink-2 mt-1">{content}</p>}
    </div>
  )
}

export default Toast
