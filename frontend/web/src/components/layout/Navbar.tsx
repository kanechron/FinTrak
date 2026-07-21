import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { getAccounts } from '../../api/accounts'
import { logout, deactivateAccount, deleteAccount } from '../../api/auth'
import ReloadPage from '../../utils/ReloadPage'
import { overlayClass, cardClass, titleClass } from '../modals/modalTheme'

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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!confirmOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [confirmOpen])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      window.location.href = '/login'
    }
  }

  async function handleDeactivation() {
    try {
      await deactivateAccount()
    } finally {
      window.location.href = '/login'
    }
  }

  async function handleDeletion() {
    try {
      await deleteAccount()
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
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmOpen(true)
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-bad hover:bg-bad/10 transition-colors"
              >
                Manage Account
              </button>
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

      {confirmOpen && (
        <div className={overlayClass} onClick={() => setConfirmOpen(false)}>
          <div className={cardClass()} onClick={(e) => e.stopPropagation()}>
            <h2 className={titleClass}>Leaving FinTrak?</h2>
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">Deactivate</span> signs you out and hides your data. You can pick up where you left off by logging back in later.
            </p>
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">Delete</span> permanently removes your account and all associated data — transactions, budgets, bills, and goals. This can't be undone.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  handleDeactivation()
                }}
                className="w-full text-sm font-semibold text-ink border border-line-2 rounded-lg py-2.5 hover:border-ink-3 transition-colors"
              >
                Deactivate Account
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  handleDeletion()
                }}
                className="w-full text-sm font-semibold text-white bg-bad rounded-lg py-2.5 hover:opacity-90 transition-opacity"
              >
                Delete Account
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="w-full text-sm font-semibold text-ink-2 py-1 hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
