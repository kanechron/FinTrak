import { useState } from 'react'
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
  const [active, setActive] = useState<Section>('general')

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <h1 className="text-xl font-semibold text-ink mb-6">Settings</h1>
      <div className="flex items-start gap-10">
        <nav className="w-44 shrink-0 flex flex-col">
          {navGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {i > 0 && <div className="border-t border-line my-3" />}
              {group.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
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

        <div className="flex-1 min-w-0 pl-10 border-l border-line min-h-96">
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
