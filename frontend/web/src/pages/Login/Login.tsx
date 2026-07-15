import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SyncPreview, ReportsPreview, BudgetsPreview, GoalsPreview } from './FeaturePreviews'

const features = [
  {
    title: 'Bank Sync',
    desc: 'Connect accounts via Plaid and keep balances and transactions in sync automatically.',
    preview: SyncPreview,
  },
  {
    title: 'Visual Reports',
    desc: 'Spending broken down by category, month, and cash flow — all interactive.',
    preview: ReportsPreview,
  },
  {
    title: 'Smart Budgets',
    desc: 'Set limits per category and see status at a glance — on track, close, or over.',
    preview: BudgetsPreview,
  },
  {
    title: 'Savings Goals',
    desc: 'Set targets, link accounts, and track progress toward what matters.',
    preview: GoalsPreview,
  },
]

export default function Login() {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')
  const aboutRef = useRef<HTMLDivElement>(null)
  const motivationRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  // Redirects the browser to the backend login endpoint which kicks off Google OAuth.
  // The backend handles the full PKCE flow and redirects back to the frontend on success.
  function handleLogin() {
    window.location.href = '/api/auth/login'
  }

  function handleRegister() {
    window.location.href = '/api/auth/register'
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="h-screen overflow-y-auto" style={{ scrollSnapType: 'y proximity' }}>
        {/* — Sign in — */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="w-80 flex flex-col items-center">
            <span className="text-xl font-semibold tracking-tight text-ink mb-7">FinTrak</span>
            <p className="text-sm text-ink-2 text-center mb-6">Sign in to access your dashboard</p>
            {error && (
              <p className="text-sm text-bad text-center mb-4">
                {error === 'no_account' && 'No account found. Please sign up.'}
                {error === 'account_exists' && 'You already have an account. Please sign in.'}
              </p>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-s1 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 cursor-pointer transition-opacity mb-2.5"
            >
              Sign in with Google
            </button>
            <button
              onClick={handleRegister}
              className="w-full bg-transparent text-ink-2 font-semibold py-2.5 rounded-xl text-sm border border-line-2 hover:text-ink hover:border-ink-3 cursor-pointer transition-colors"
            >
              Create an account
            </button>
          </div>

          <button
            onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-9 flex flex-col items-center gap-2 text-ink-3 hover:text-ink-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors animate-bounce"
          >
            <span>About this project</span>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path
                d="M1 1L7 7L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* — About — */}
        <section
          ref={aboutRef}
          className="relative min-h-screen flex flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="w-80 flex flex-col items-center">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-3.5">About</p>
            <p className="text-[13.5px] leading-relaxed text-ink-2 text-center mb-5">
              FinTrak is a personal finance tracker I built end-to-end — React on the front end,
              ASP.NET Core on the back, real bank data via Plaid, deployed on my own server. It's
              both a tool I use daily and a portfolio piece.
            </p>
            <div className="flex justify-center gap-5">
              <a href="#" className="text-xs font-semibold text-s1 hover:underline">
                GitHub
              </a>
              <a href="#" className="text-xs font-semibold text-s1 hover:underline">
                LinkedIn
              </a>
            </div>
          </div>

          <button
            onClick={() => motivationRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-9 flex flex-col items-center gap-2 text-ink-3 hover:text-ink-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors animate-bounce"
          >
            <span>Why I built this</span>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path
                d="M1 1L7 7L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* — Motivation — */}
        <section
          ref={motivationRef}
          className="relative min-h-screen flex flex-col items-center justify-center px-6"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="w-80 flex flex-col items-center">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-3.5">Why I Built This</p>
            <p className="text-[13.5px] leading-relaxed text-ink-2 text-center">
              I created FinTrak to understand my own spending patterns — where my money was
              actually going, month to month. It's also a response to a broader distrust I have
              in fintech: with FinTrak, my financial data is never sold or shared with anyone. It
              started as a personal tool, but it now serves the people around me too.
            </p>
          </div>

          <button
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-9 flex flex-col items-center gap-2 text-ink-3 hover:text-ink-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors animate-bounce"
          >
            <span>Features</span>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path
                d="M1 1L7 7L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* — Features — */}
        <section
          ref={featuresRef}
          className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
          style={{ scrollSnapAlign: 'start' }}
        >
          <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-8">Features</p>
          <div className="w-full max-w-2xl grid grid-cols-2 gap-8">
            {features.map((f) => {
              const Preview = f.preview
              return (
                <div key={f.title}>
                  <Preview />
                  <p className="text-[13.5px] font-semibold text-ink mt-3.5">{f.title}</p>
                  <p className="text-xs text-ink-3 leading-relaxed mt-1">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
