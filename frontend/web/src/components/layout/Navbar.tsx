import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { getAccounts } from '../../api/accounts'
import { logout } from '../../api/auth'
import ReloadPage from '../../utils/ReloadPage'

const leftTabs = [
  { label: 'Dashboard', path: '/' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Budgets', path: '/budgets' },
]

const rightTabs = [
  { label: 'Goals', path: '/goals' },
  { label: 'Bills', path: '/bills' },
  { label: 'Reports', path: '/reports' },
]

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 self-stretch flex items-center justify-center text-sm font-semibold tracking-widest uppercase transition-colors ${
    isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
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
    idle: 'text-purple-400 hover:text-purple-200',
    connecting: 'text-purple-500 cursor-not-allowed',
    syncing: 'text-purple-500 cursor-not-allowed',
    done: 'text-emerald-400',
    error: 'text-red-400',
  }

  return (
    <header className="sticky top-0 z-[9999] bg-gray-950 border-b border-gray-800 h-14 flex items-stretch justify-between">
<nav className="flex-1 flex items-stretch">
        {leftTabs.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.path === '/'} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={handleClick}
          disabled={status === 'syncing' || status === 'connecting'}
          className={`self-stretch flex items-center px-8 text-sm font-semibold tracking-widest uppercase transition-colors ${color[status]}`}
        >
          {label[status]}
        </button>
        {rightTabs.map(tab => (
          <NavLink key={tab.path} to={tab.path} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center px-6 relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm transition-colors"
        >
          J
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
            <button
              onClick={() => { setMenuOpen(false); navigate('/settings') }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Settings
            </button>
            <div className="border-t border-gray-800" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
