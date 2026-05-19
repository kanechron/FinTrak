import { useState } from 'react'

export default function Navbar() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')

  async function sync() {
    setStatus('syncing')
    try {
      const res = await fetch('/api/plaid/sync', {
        method: 'POST',
        credentials: 'include',
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }

  }

  const label = {
    idle: 'Sync',
    syncing: 'Syncing...',
    done: 'Synced',
    error: 'Failed',
  }[status]

  const color = {
    idle: 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200',
    syncing: 'text-gray-500 border-gray-800 cursor-not-allowed',
    done: 'text-emerald-400 border-emerald-800',
    error: 'text-red-400 border-red-800',
  }[status]

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-semibold tracking-tight">FinTrak</span>
      <button
        onClick={sync}
        disabled={status === 'syncing'}
        className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${color}`}
      >
        {label}
      </button>
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">J</div>
    </header>
  )
}
