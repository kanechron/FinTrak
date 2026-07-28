import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import General from './Tabs/General'
import Account from './Tabs/Account'
import Display from './Tabs/Display'
import Transactions from './Tabs/Transactions'
import Budgets from './Tabs/Budgets'
import Goals from './Tabs/Goals'
import Bills from './Tabs/Bills'
import Reports from './Tabs/Reports'

type Section =
  'general' | 'account' | 'display' | 'transactions' | 'budgets' | 'goals' | 'bills' | 'reports'

const navGroups = [
  {
    items: [
      { id: 'general' as Section, label: 'General' },
      { id: 'account' as Section, label: 'Account' },
      { id: 'display' as Section, label: 'Display' },
    ],
  },
  {
    items: [
      { id: 'transactions' as Section, label: 'Transactions' },
      { id: 'budgets' as Section, label: 'Budgets' },
      { id: 'goals' as Section, label: 'Goals' },
      { id: 'bills' as Section, label: 'Bills' },
      { id: 'reports' as Section, label: 'Reports' },
    ],
  },
]

export default function Settings() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Section>('general')
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeLabel = navGroups.flatMap((g) => g.items).find((s) => s.id === active)?.label

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <div className={`${mobileOpen ? 'hidden' : 'flex'} sm:hidden items-center gap-3 mb-6`}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Close settings"
          className="text-3xl leading-none text-ink-2 hover:text-ink transition-colors"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
      </div>
      <h1 className="hidden sm:block text-xl font-semibold text-ink mb-6">Settings</h1>
      {mobileOpen && (
        <div className="sm:hidden flex items-center gap-3 mb-6">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Back to settings list"
            className="text-3xl leading-none text-ink-2 hover:text-ink transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-ink">{activeLabel}</h1>
        </div>
      )}
      <div className="flex items-start gap-10">
        <nav
          className={`${mobileOpen ? 'hidden' : 'flex'} sm:flex w-full sm:w-44 shrink-0 flex-col`}
        >
          {navGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {i > 0 && <div className="border-t border-line my-3" />}
              {group.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActive(s.id)
                    setMobileOpen(true)
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    active === s.id
                      ? 'bg-raised text-ink'
                      : 'text-ink-3 hover:text-ink-2 hover:bg-raised'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div
          className={`${mobileOpen ? 'flex' : 'hidden'} sm:flex flex-1 min-w-0 sm:pl-10 sm:border-l sm:border-line min-h-96 flex-col`}
        >
          {active === 'general' && <General />}
          {active === 'account' && <Account />}
          {active === 'display' && <Display />}
          {active === 'transactions' && <Transactions />}
          {active === 'budgets' && <Budgets />}
          {active === 'goals' && <Goals />}
          {active === 'bills' && <Bills />}
          {active === 'reports' && <Reports />}
        </div>
      </div>
    </main>
  )
}
