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

const label: Record<Status, string> = {
  idle: 'Sync',
  connecting: 'Connecting...',
  syncing: 'Syncing...',
  done: 'Synced',
  error: 'Failed',
}

const color: Record<Status, string> = {
  idle: 'text-s1 hover:text-ink',
  connecting: 'text-s1 cursor-not-allowed',
  syncing: 'text-s1 cursor-not-allowed',
  done: 'text-good',
  error: 'text-bad',
}

export default function SyncButton() {
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

  // Open Plaid Link once the token is ready, guarded against StrictMode double-fire
  useEffect(() => {
    if (linkToken && ready && !opened.current) {
      opened.current = true
      open()
    }
  }, [linkToken, ready])

  return (
    <button
      onClick={handleClick}
      disabled={status === 'syncing' || status === 'connecting'}
      className={`px-2.5 py-2 text-[12.5px] font-semibold transition-colors ${color[status]}`}
    >
      {label[status]}
    </button>
  )
}
