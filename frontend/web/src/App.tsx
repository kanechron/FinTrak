import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Timer } from "./hooks/InactivityLogoutHook";
import Dashboard from "./pages/Dashboard/Dashboard";
import Transactions from "./pages/Transactions/Transactions";
import Budgets from "./pages/Budgets/Budgets";
import Goals from "./pages/Goals/Goals";
import Bills from "./pages/Bills/Bills";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Login/Login";
import Navbar from "./components/layout/Navbar";

// Checks if the user is authenticated by calling a protected endpoint.
// Returns true if the server responds with 200, false if 401.
async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch("/api/plaid/link-token", {
      method: "POST",
      credentials: "include",
      redirect: "manual",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  // On mount, check if the user is already authenticated.
  // null = still checking, true = authenticated, false = not authenticated.
  useEffect(() => {
    checkAuth().then(setAuthed);
  }, []);

  // Show nothing while auth check is in flight to avoid a flash of the wrong page.
  if (authed === null) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={authed ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="*"
          element={
            authed ? (
              <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
                <Timer timer={1800} />{" "}
                {/* 1800 = 30 minutes in seconds 
                REMINDER: Add configurable timeout to settings
                */}
                <Navbar />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/bills" element={<Bills />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
