import { useState, useEffect, useRef } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import ReloadPage from '../../utils/ReloadPage'

async function fetchLinkToken(): Promise<string> {
  const res = await fetch('/api/plaid/link-token', { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch link token')
  return (await res.json()).link_token
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

type Status = 'idle' | 'connecting' | 'syncing' | 'error'

export default function Welcome() {
  const [status, setStatus] = useState<Status>('idle')
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const opened = useRef(false)

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        await exchangeToken(publicToken)
        setStatus('syncing')
        await runSync()
        ReloadPage()
      } catch {
        setStatus('error')
      }
    },
    onExit: () => setStatus('idle'),
  })

  useEffect(() => {
    if (linkToken && ready && !opened.current) {
      opened.current = true
      open()
    }
  }, [linkToken, ready])

  async function handleConnect() {
    if (status === 'connecting' || status === 'syncing') return
    try {
      setStatus('connecting')
      const token = await fetchLinkToken()
      setLinkToken(token)
    } catch {
      setStatus('error')
    }
  }

  const label: Record<Status, string> = {
    idle: 'Connect your bank',
    connecting: 'Connecting...',
    syncing: 'Syncing...',
    error: 'Failed — try again',
  }

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 flex flex-col items-center justify-center gap-4" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
      <p className="text-gray-400 text-sm">Connect your bank to begin</p>
      <button
        onClick={handleConnect}
        disabled={status === 'connecting' || status === 'syncing'}
        className="mt-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
      >
        {label[status]}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
      )}
    </main>
  )
}
