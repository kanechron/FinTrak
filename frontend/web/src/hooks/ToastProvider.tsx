import React, { createContext, useCallback, useContext, useState } from 'react'
import Toast, { type ToastData } from './ToastHook'

// Session-scoped so a toast fired right before a reload (e.g. sync completing) still shows
// up after the page comes back, but doesn't linger across browser restarts.
const STORAGE_KEY = 'fintrak_toasts'

interface ToastOptions {
  title: string
  content: string
  duration?: number
}

interface ToastContextValue {
  success: (options: ToastOptions) => void
  error: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function readStored(): ToastData[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeStored(toasts: ToastData[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toasts))
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initializer: reads sessionStorage once on mount, so a toast fired right
  // before a reload is showing again immediately, with no flash of an empty list first.
  const [toasts, setToasts] = useState<ToastData[]>(readStored)

  // Reads/writes go straight through sessionStorage synchronously, so a toast fired
  // immediately before window.location.reload() is guaranteed to be persisted before
  // the page unloads (an effect-based sync could lose the race).
  const remove = useCallback((id: string) => {
    const next = readStored().filter((t) => t.id !== id)
    writeStored(next)
    setToasts(next)
  }, [])

  const addToast = useCallback((type: ToastData['type'], options: ToastOptions) => {
    const next = [...readStored(), { id: crypto.randomUUID(), type, ...options }]
    writeStored(next)
    setToasts(next)
  }, [])

  // success/error are the only entry points callers use — toasting stays opt-in per
  // call site (each fetch action wraps itself in try/catch and calls one of these).
  const value: ToastContextValue = {
    success: (options) => addToast('success', options),
    error: (options) => addToast('error', options),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[10001] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} destroy={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
