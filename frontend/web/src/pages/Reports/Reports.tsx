import { useState, useEffect } from 'react'
import { getCategorySpending, getMonthlySpending, getCashFlow, type CategorySpending, type CashFlow } from '../../api/reports'
import { getBudgets, type Budget } from '../../api/budgets'
import CategorySpendingChart from '../../components/charts/CategorySpendingChart'
import MonthlySpendingChart, { type MonthlySpending } from '../../components/charts/MonthlySpendingChart'
import BudgetPerformanceChart from '../../components/charts/BudgetPerformanceChart'
import CashFlowChart from '../../components/charts/CashFlowChart'

const PERIODS = ['7d', '30d', '90d', '6m', '1y', 'All']

function periodToDates(period: string): { from?: string; to?: string } {
  const to = new Date()
  const from = new Date()
  switch (period) {
    case '7d': from.setDate(from.getDate() - 7); break
    case '30d': from.setDate(from.getDate() - 30); break
    case '90d': from.setDate(from.getDate() - 90); break
    case '6m': from.setMonth(from.getMonth() - 6); break
    case '1y': from.setFullYear(from.getFullYear() - 1); break
    case 'All': return {}
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}


export default function Reports() {
  const [period, setPeriod] = useState('30d')
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([])

  useEffect(() => {
    const { from, to } = periodToDates(period)
    getCategorySpending(from, to).then(setCategorySpending)
    getMonthlySpending(from, to).then(setMonthlySpending)
    getCashFlow(from, to).then(setCashFlow)
  }, [period])

  useEffect(() => {
    getBudgets().then(setBudgets)
  }, [])

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

      <CategorySpendingChart data={categorySpending} />

      <MonthlySpendingChart data={monthlySpending} />

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-6">
        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="font-medium">Budget Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Spent vs limit per budget</p>
          </div>
          <BudgetPerformanceChart data={budgets} />
        </section>

        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="font-medium">Income vs Expenses</h2>
            <p className="text-xs text-gray-500 mt-0.5">Net cash flow per month</p>
          </div>
          <CashFlowChart data={cashFlow} />
        </section>
      </div>

    </main>
  )
}
