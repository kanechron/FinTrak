import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout, deactivateAccount, deleteAccount } from '../../api/auth'
import SyncButton from './SyncButton'
import ManageAccountModal from '../modals/ManageAccountModal'

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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false)
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

  return (
    <header className="sticky top-0 z-[9999] bg-page border-b border-line h-14 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-6">
        <div ref={navRef}>
          <button
            onClick={() => setNavOpen((prev) => !prev)}
            className="md:hidden -ml-1.5 p-1.5 text-ink-2 hover:text-ink transition-colors"
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5.5H17M3 10H17M3 14.5H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {navOpen && (
            <nav className="md:hidden fixed top-14 left-0 right-0 bg-page border-b border-line shadow-xl flex flex-col p-2">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '/'}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-[13.5px] font-semibold transition-colors ${
                      isActive ? 'text-ink bg-raised' : 'text-ink-2 hover:bg-raised'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path} end={tab.path === '/'} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <SyncButton />

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
              <a
                href="mailto:dowjames0903@gmail.com?subject=FinTrak%20Feedback%20%2F%20Bug%20Report"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-ink-2 hover:bg-raised hover:text-ink transition-colors"
              >
                Contact / Report a Bug
              </a>
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

      <ManageAccountModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onDeactivate={handleDeactivation}
        onDelete={handleDeletion}
      />
    </header>
  )
}
