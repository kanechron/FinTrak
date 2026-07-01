import { useSearchParams } from "react-router-dom";

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");


  // Redirects the browser to the backend login endpoint which kicks off Google OAuth.
  // The backend handles the full PKCE flow and redirects back to the frontend on success.
  function handleLogin() {
    window.location.href = '/api/auth/login'
  }

  function handleRegister() {
    window.location.href = '/api/auth/register'
  }

  

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex items-center justify-center">
      <div className="border border-gray-800 rounded-xl p-10 flex flex-col items-center gap-6 w-80">
        <span className="text-2xl font-semibold tracking-tight">FinTrak</span>
        <p className="text-sm text-gray-500 text-center">Sign in to access your dashboard</p>
        {error && (
          <p className="text-sm text-red-400 text-center">
            {error === "no_account" && "No account found. Please sign up."}
            {error === "account_exists" && "You already have an account. Please sign in."}
          </p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-white text-gray-900 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Sign in with Google
        </button>
        <button
          onClick={handleRegister}
          className="w-full bg-white text-gray-900 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Create an account
        </button>
      </div>
    </div>
  )
}
