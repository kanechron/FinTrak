import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { getAccounts } from '../../api/accounts'
import { logout } from '../../api/auth'
import ReloadPage from '../../utils/ReloadPage'

const tabs = [
  { label: 'Dashboard', path: '/' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Budgets', path: '/budgets' },
  { label: 'Goals', path: '/goals' },
  { label: 'Bills', path: '/bills' },
  { label: 'Reports', path: '/reports' },
]

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
    isActive ? 'text-ink bg-raised' : 'text-ink-3 hover:text-ink-2 hover:bg-raised'
  }`

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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      window.location.href = '/login'
    }
  }

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
    idle: 'text-s1 hover:text-ink',
    connecting: 'text-s1 cursor-not-allowed',
    syncing: 'text-s1 cursor-not-allowed',
    done: 'text-good',
    error: 'text-bad',
  }

  return (
    <header className="sticky top-0 z-[9999] bg-page border-b border-line h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-[14px] tracking-tight text-ink">FinTrak</span>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path} end={tab.path === '/'} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          disabled={status === 'syncing' || status === 'connecting'}
          className={`px-2.5 py-2 text-[12.5px] font-semibold transition-colors ${color[status]}`}
        >
          {label[status]}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-[30px] h-[30px] rounded-full bg-s1 hover:opacity-90 flex items-center justify-center text-xs font-semibold text-white transition-opacity"
          >
            J
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-40 bg-card border border-line rounded-xl shadow-xl overflow-hidden z-50 p-1">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/settings')
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-ink-2 hover:bg-raised hover:text-ink transition-colors"
              >
                Settings
              </button>
              <div className="border-t border-line my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-bad hover:bg-raised transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
