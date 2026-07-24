import { useEffect } from 'react'

// Locks page scroll while a modal is open, so the page behind it can't be scrolled.
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [locked])
}
