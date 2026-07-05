import { useState, useEffect, useRef, useMemo } from 'react'
import { getCategorySpending, getMonthlySpending, getCashFlow, type CategorySpending, type CashFlow } from '../../api/reports'
import { getBudgets, type Budget } from '../../api/budgets'
import CategorySpendingChart from '../../components/charts/CategorySpendingChart'
import MonthlySpendingChart, { type MonthlySpending } from '../../components/charts/MonthlySpendingChart'
import BudgetPerformanceChart from '../../components/charts/BudgetPerformanceChart'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryDetailCarousel from '../../components/charts/CategoryDetailCarousel'

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
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [exportOpen, setExportOpen] = useState<string | null>(null)

  const { from, to } = periodToDates(period)

  useEffect(() => {
    Promise.all([
      getCategorySpending(from, to),
      getMonthlySpending(from, to),
      getCashFlow(from, to),
    ])
      .then(([cat, monthly, cash]) => {
        setCategorySpending(cat)
        setMonthlySpending(monthly)
        setCashFlow(cash)
        setSelectedCategoryIds(new Set())
      })
      .catch(() => setError('Failed to load report data.'))
  }, [period])

  useEffect(() => {
    getBudgets().then(setBudgets).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
      if (!(e.target as Element).closest('[data-export-dropdown]'))
        setExportOpen(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleExport(format: 'csv' | 'xlsx', endpoint: string) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('format', format)
    window.location.href = `/api/reports/${endpoint}?${params.toString()}`
    setExportOpen(null)
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

    const selectedCategories = useMemo(
      () => categorySpending.filter(c => selectedCategoryIds.has(c.id)),
      [categorySpending, selectedCategoryIds]
    )


  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Filter bar */}
      <div className="flex items-center gap-3 border border-gray-800 rounded-xl px-5 py-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Period</span>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === p ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-800 mx-2" />

        {/* Categories dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className={`text-xs border rounded-md px-3 py-1 transition-colors ${
              selectedCategoryIds.size > 0
                ? 'text-purple-400 border-purple-700 hover:border-purple-500'
                : 'text-gray-500 border-gray-800 hover:text-gray-300'
            }`}
          >
            {selectedCategoryIds.size > 0 ? `Categories (${selectedCategoryIds.size})` : 'Categories'} ▾
          </button>
          {dropdownOpen && categorySpending.length > 0 && (
            <div className="absolute left-0 top-8 z-50 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {categorySpending.map(c => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.has(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="accent-purple-500"
                    />
                    <span className="text-xs text-gray-300 truncate">
                      {c.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, x => x.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
              {selectedCategoryIds.size > 0 && (
                <div className="border-t border-gray-800 px-4 py-2">
                  <button
                    onClick={() => setSelectedCategoryIds(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Category Spending</h2>
            <p className="text-xs text-gray-500 mt-0.5">Spending breakdown by category</p>
          </div>
          <div className="relative" data-export-dropdown>
            <button
              onClick={() => setExportOpen(o => o === 'cat' ? null : 'cat')}
              className="text-xs border border-gray-800 rounded-md px-3 py-1 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
            >
              Export ▾
            </button>
            {exportOpen === 'cat' && (
              <div className="absolute right-0 top-8 z-50 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                <button onClick={() => handleExport('csv', 'category-spending')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                  CSV
                </button>
                <button onClick={() => handleExport('xlsx', 'category-spending')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
        <CategorySpendingChart data={categorySpending} />
      </section>

      {selectedCategories.length > 0 && (
        <CategoryDetailCarousel categories={selectedCategories} from={from} to={to} />
      )}

      <section className="border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Category Spending</h2>
            <p className="text-xs text-gray-500 mt-0.5">Spending breakdown by category</p>
          </div>
          <div className="relative" data-export-dropdown>
            <button
              onClick={() => setExportOpen(o => o === 'monthly' ? null : 'monthly')}
              className="text-xs border border-gray-800 rounded-md px-3 py-1 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
            >
              Export ▾
            </button>
            {exportOpen === 'monthly' && (
              <div className="absolute right-0 top-8 z-50 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                <button onClick={() => handleExport('csv', 'monthly-spending')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                  CSV
                </button>
                <button onClick={() => handleExport
                  ('xlsx', 'monthly-spending')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
      <MonthlySpendingChart data={monthlySpending} />
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="font-medium">Budget Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Spent vs limit per budget</p>
          </div>
          <BudgetPerformanceChart data={budgets} />
        </section>

        <section className="border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Income vs Expenses</h2>
              <p className="text-xs text-gray-500 mt-0.5">Net cash flow per month</p>
            </div>
            <div className="relative" data-export-dropdown>
              <button
                onClick={() => setExportOpen(o => o === 'cashflow' ? null : 'cashflow')}
                className="text-xs border border-gray-800 rounded-md px-3 py-1 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
              >
                Export ▾
              </button>
              {exportOpen === 'cashflow' && (
                <div className="absolute right-0 top-8 z-50 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                  <button onClick={() => handleExport('csv', 'cash-flow')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                    CSV
                  </button>
                  <button onClick={() => handleExport('xlsx', 'cash-flow')} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors">
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          <CashFlowChart data={cashFlow} />
        </section>
      </div>
    </main>
  )
}
