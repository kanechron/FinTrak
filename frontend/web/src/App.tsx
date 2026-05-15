import Dashboard from './pages/Dashboard/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">FinTrak</span>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">J</div>
      </header>
      <Dashboard />
    </div>
  )
}

export default App
