import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ImportPreview, ReportsPreview, BillsPreview, GoalsPreview } from './FeaturePreviews'
import { reactivateAccount } from '../../api/auth'

const features = [
  {
    title: 'Statement Import',
    desc: 'Upload a bank statement and let it extract and categorize the transactions for you.',
    preview: ImportPreview,
  },
  {
    title: 'Visual Reports',
    desc: 'Spending broken down by category, month, and cash flow, all interactive.',
    preview: ReportsPreview,
  },
  {
    title: 'Auto-Detected Bills',
    desc: 'Recurring charges are spotted automatically, just confirm or deny each one.',
    preview: BillsPreview,
  },
  {
    title: 'Priority Goals',
    desc: 'Reorder goals by what matters most, and track progress on each one.',
    preview: GoalsPreview,
  },
]

export default function Login() {
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const error = searchParams.get('error')
  const aboutRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [reactivating, setReactivating] = useState(false)
  const [reactivateError, setReactivateError] = useState<string | null>(null)

  // Redirects the browser to the backend login endpoint which kicks off Google OAuth.
  // The backend handles the full PKCE flow and redirects back to the frontend on success.
  function handleLogin() {
    window.location.href = '/api/auth/login'
  }

  function handleRegister() {
    window.location.href = '/api/auth/register'
  }

  async function handleReactivate() {
    setReactivating(true)
    setReactivateError(null)
    try {
      await reactivateAccount()
      window.location.href = '/'
    } catch {
      setReactivateError('Could not reactivate your account. Please try logging in again.')
      setReactivating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('contact@fintrak.org');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="h-screen overflow-y-auto no-scrollbar">
        {/* — Sign in — */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center px-6"
        >
          <div className="w-80 flex flex-col items-center">
            <span className="text-xl font-semibold tracking-tight text-ink mb-7">FinTrak</span>
            <p className="text-sm text-ink-2 text-center mb-6">Sign in to access your dashboard</p>
            {error && error !== 'account_deactivated' && (
              <p className="text-sm text-bad text-center mb-4">
                {error === 'no_account' && 'No account found. Please sign up.'}
                {error === 'account_exists' && 'You already have an account. Please sign in.'}
              </p>
            )}

            {error === 'account_deactivated' ? (
              <>
                <p className="text-sm text-ink-2 text-center mb-4">
                  This account was deactivated. Reactivate it to pick up right where you left off.
                </p>
                {reactivateError && (
                  <p className="text-sm text-bad text-center mb-4">{reactivateError}</p>
                )}
                <button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="w-full bg-s1 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 cursor-pointer transition-opacity mb-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {reactivating ? 'Reactivating...' : 'Reactivate Account'}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <button
            onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-9 flex flex-col items-center gap-2 text-ink-3 hover:text-ink-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
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
        >
          <div className="w-full max-w-lg flex flex-col items-center">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-8">About</p>

            <div className="flex flex-col gap-4">
              <p className="text-[13.5px] leading-relaxed text-ink-2">
                It's rare that we directly interact with our money anymore. Between credit and electronic payments, spending has lost its weight, and with it, the awareness that comes from physically parting with our cash. FinTrak keeps track of where it actually goes: every transaction laid out, trends in how you spend, and goals or limits you set to stay on track.
              </p>
              <p className="text-[13.5px] leading-relaxed text-ink-2">
                Built around knowing exactly where your data comes from and where it's going, FinTrak is regularly receiving new features and refinements, all in order to give you the clearest possible picture of your spending.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-7">
              {['React', 'ASP.NET Core', 'PostgreSQL', 'Plaid', 'AI Integration'].map((tech) => (
                <span
                  key={tech}
                  className="text-[10.5px] font-medium text-ink-3 bg-raised rounded-full px-2.5 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
            
            <p className="text-xs font-medium text-s3 bg-s3/15 text-center mt-5 max-w-sm rounded-full px-4 py-2">
              Interested in contributing? Reach out, or visit the GitHub repo for more information.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <a
                
                href="https://github.com/kanechron/FinTrak"
                className="text-xs font-semibold text-ink-2 border border-line-2 rounded-full px-4 py-1.5 hover:text-ink hover:border-ink-3 transition-colors"
              >
                GitHub
              </a>
              <button
                
                onClick={handleCopy}
                className="text-xs font-semibold text-ink-2 border border-line-2 rounded-full px-4 py-1.5 hover:text-ink hover:border-ink-3 transition-colors"
              >
                {copied ? "Copied to clipboard" : "Email"}
              </button>
            </div>
          </div>

          <button
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-9 flex flex-col items-center gap-2 text-ink-3 hover:text-ink-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
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
            <div className="col-span-2 flex flex-col items-center justify-center border border-dashed border-line-2 rounded-xl text-ink-3 py-10">
              <span className="text-2xl leading-none">+</span>
              <span className="text-xs font-medium mt-1.5">More coming soon</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
