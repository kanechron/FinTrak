import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Login/Login'
import Navbar from './components/layout/Navbar'

// Checks if the user is authenticated by calling a protected endpoint.
// Returns true if the server responds with 200, false if 401.
async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/plaid/link-token', {
      method: 'POST',
      credentials: 'include',
    })
    return res.status !== 401
  } catch {
    return false
  }
}

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  // On mount, check if the user is already authenticated.
  // null = still checking, true = authenticated, false = not authenticated.
  useEffect(() => {
    checkAuth().then(setAuthed)
  }, [])

  // Show nothing while auth check is in flight to avoid a flash of the wrong page.
  if (authed === null) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={authed ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={
            authed ? (
              <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
                <Navbar />
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
