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
    <main className="max-w-5xl mx-auto px-3 py-8">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <div className="flex gap-6">
        <nav className="w-44 shrink-0 flex flex-col gap-4">
          {navGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-1">
              {i > 0 && <div className="border-t border-gray-800 mb-2" />}
              {group.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    active === s.id
                      ? 'bg-gray-800 text-white font-medium'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex-1 border border-gray-800 rounded-xl p-6 min-h-96">
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
