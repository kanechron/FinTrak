// Charts are not yet implemented — each section is a placeholder for a future chart component.
// Recommended library: Recharts (recharts.org) — works well with React and Tailwind.
// Filter state (period, categories, accounts) will be wired to chart data before passing to Recharts.

import { useState } from 'react'

const PERIODS = ['7d', '30d', '90d', '6m', '1y', 'All']

const selectClass = "bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-400 px-2 py-1 focus:outline-none focus:border-gray-500"

export default function Reports() {
  const [period, setPeriod] = useState('30d')
  const [categoryChartType, setCategoryChartType] = useState('Pie')
  const [trendChartType, setTrendChartType] = useState('Line')
  const [budgetChartType, setBudgetChartType] = useState('Bar')
  const [cashFlowChartType, setCashFlowChartType] = useState('Bar')

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>

      {/* Filter bar */}
      <div className="flex items-center gap-3 border border-gray-800 rounded-xl px-5 py-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Period</span>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === p
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-800 mx-2" />
        {/* Category and account filters — wired when charts are implemented */}
        <button className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 rounded-md px-3 py-1 transition-colors">
          Categories ▾
        </button>
        <button className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 rounded-md px-3 py-1 transition-colors">
          Accounts ▾
        </button>
      </div>

      {/* Spending by Category */}
      <section className="border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Spending by Category</h2>
            <p className="text-xs text-gray-500 mt-0.5">Breakdown for selected period</p>
          </div>
          <select value={categoryChartType} onChange={e => setCategoryChartType(e.target.value)} className={selectClass}>
            <option>Pie</option>
            <option>Donut</option>
            <option>Bar</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center rounded-lg bg-gray-900/50 text-gray-500 text-sm">
          {categoryChartType} chart placeholder
        </div>
      </section>

      {/* Monthly Spending Trend */}
      <section className="border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Monthly Spending Trend</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total spend over selected period</p>
          </div>
          <select value={trendChartType} onChange={e => setTrendChartType(e.target.value)} className={selectClass}>
            <option>Line</option>
            <option>Area</option>
            <option>Bar</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center rounded-lg bg-gray-900/50 text-gray-500 text-sm">
          {trendChartType} chart placeholder
        </div>
      </section>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-6">
        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Budget Performance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Spent vs limit per budget</p>
            </div>
            <select value={budgetChartType} onChange={e => setBudgetChartType(e.target.value)} className={selectClass}>
              <option>Bar</option>
              <option>Line</option>
            </select>
          </div>
          <div className="h-48 flex items-center justify-center rounded-lg bg-gray-900/50 text-gray-500 text-sm">
            {budgetChartType} chart placeholder
          </div>
        </section>

        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Income vs Expenses</h2>
              <p className="text-xs text-gray-500 mt-0.5">Net cash flow per month</p>
            </div>
            <select value={cashFlowChartType} onChange={e => setCashFlowChartType(e.target.value)} className={selectClass}>
              <option>Bar</option>
              <option>Line</option>
              <option>Area</option>
            </select>
          </div>
          <div className="h-48 flex items-center justify-center rounded-lg bg-gray-900/50 text-gray-500 text-sm">
            {cashFlowChartType} chart placeholder
          </div>
        </section>
      </div>

    </main>
  )
}
