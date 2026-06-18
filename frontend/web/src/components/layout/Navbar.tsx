import { useState, useEffect, useRef } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { getAccounts } from '../../api/accounts'
import ReloadPage from '../../utils/ReloadPage'

type Status = 'idle' | 'connecting' | 'syncing' | 'done' | 'error'

async function fetchLinkToken(): Promise<string> {
  const res = await fetch('/api/plaid/link-token', { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch link token')
  const data = await res.json()
  return data.link_token
}

async function exchangeToken(publicToken: string): Promise<void> {
  const res = await fetch('/api/plaid/exchange-token', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicToken }),
  })
  if (!res.ok) throw new Error('Failed to exchange token')
}

async function runSync(): Promise<void> {
  const res = await fetch('/api/plaid/sync', { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Sync failed')
}

export default function Navbar() {
  const [status, setStatus] = useState<Status>('idle')
  const [linkToken, setLinkToken] = useState<string | null>(null)

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        await exchangeToken(publicToken)
        setStatus('syncing')
        await runSync()
        setStatus('done')
        ReloadPage()
      } catch {
        setStatus('error')
      }
    },
    onExit: () => {
      setStatus('idle')
    },
  })

  async function handleClick() {
    if (status === 'syncing' || status === 'connecting') return
    try {
      const accounts = await getAccounts()
      if (accounts.length === 0) {
        setStatus('connecting')
        const token = await fetchLinkToken()
        setLinkToken(token)
      } else {
        setStatus('syncing')
        await runSync()
        setStatus('done')
        ReloadPage()
      }
    } catch {
      setStatus('error')
    }
  }

  const opened = useRef(false)

  // Open Plaid Link once the token is ready, guarded against StrictMode double-fire
  useEffect(() => {
    if (linkToken && ready && !opened.current) {
      opened.current = true
      open()
    }
  }, [linkToken, ready])

  const label: Record<Status, string> = {
    idle: 'Sync',
    connecting: 'Connecting...',
    syncing: 'Syncing...',
    done: 'Synced',
    error: 'Failed',
  }

  const color: Record<Status, string> = {
    idle: 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200',
    connecting: 'text-gray-500 border-gray-800 cursor-not-allowed',
    syncing: 'text-gray-500 border-gray-800 cursor-not-allowed',
    done: 'text-emerald-400 border-emerald-800',
    error: 'text-red-400 border-red-800',
  }

  return (
    <header className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-semibold tracking-tight">FinTrak</span>
      <button
        onClick={handleClick}
        disabled={status === 'syncing' || status === 'connecting'}
        className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${color[status]}`}
      >
        {label[status]}
      </button>
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">J</div>
    </header>
  )
}
