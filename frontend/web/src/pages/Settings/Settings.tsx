import { useState } from 'react'
import { createInvite } from '../../api/invites'

type Section = 'general' | 'account' | 'display' | 'transactions' | 'budgets' | 'goals' | 'bills' | 'reports'

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
              {group.items.map(s => (
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
          {active === 'general' && <GeneralSection />}
          {active === 'account' && <AccountSection />}
          {active === 'display' && <DisplaySection />}
          {active === 'transactions' && <FeatureSection name="Transactions" />}
          {active === 'budgets' && <FeatureSection name="Budgets" />}
          {active === 'goals' && <FeatureSection name="Goals" />}
          {active === 'bills' && <FeatureSection name="Bills" />}
          {active === 'reports' && <FeatureSection name="Reports" />}
        </div>
      </div>
    </main>
  )
}

function GeneralSection() {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerateInvite() {
    setLoading(true)
    setError(null)
    try {
      const link = await createInvite()
      setInviteLink(link)
      setCopied(false)
    } catch {
      setError('Failed to generate invite link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-medium">General</h2>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Invite a user</h3>
        <p className="text-sm text-gray-500">Generate a single-use invite link. Links expire after 48 hours.</p>
        <button
          onClick={handleGenerateInvite}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-sm rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate invite link'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {inviteLink && (
          <div className="flex items-center gap-2 mt-3">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AccountSection() {
  return (
    <div className="space-y-6">
      <h2 className="font-medium">Account</h2>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </div>
  )
}

function DisplaySection() {
  return (
    <div className="space-y-6">
      <h2 className="font-medium">Display</h2>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </div>
  )
}

function FeatureSection({ name }: { name: string }) {
  return (
    <div className="space-y-6">
      <h2 className="font-medium">{name}</h2>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </div>
  )
}
