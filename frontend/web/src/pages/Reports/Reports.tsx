import { useState, useEffect, useRef, useMemo } from 'react'
import {
  getCategorySpending,
  getMonthlySpending,
  getCashFlow,
  getCashFlowTransactions,
  type CategorySpending,
  type CashFlow,
  getMonthlyTransactions,
} from '../../api/reports'
import { getBudgets, type Budget } from '../../api/budgets'
import { getTransactionsByCategory, getTransactionsByDetailedCategory, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import CategorySpendingChart from '../../components/charts/CategorySpendingChart'
import MonthlySpendingChart, {
  type MonthlySpending,
} from '../../components/charts/MonthlySpendingChart'
import BudgetPerformanceChart from '../../components/charts/BudgetPerformanceChart'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryDetailCarousel from '../../components/charts/CategoryDetailCarousel'

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function defaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return isoDate(d)
}

const formatCategoryName = (v: string) =>
  v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())

export default function Reports() {
  // — Data
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([])
  const [categoryTransactions, setCategoryTransactions] = useState<Transaction[]>([])
  const [clickedCategory, setClickedCategory] = useState<{ id: string; name: string } | null>(null)

  // — UI state
  const [error, setError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState<string | null>(null)

  // — Filters
  const [fromDate, setFromDate] = useState(defaultFrom())
  const [toDate, setToDate] = useState(isoDate(new Date()))
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // — Panel filters
  const [sortField, setSortField] = useState<'amount' | 'name' | 'date'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [panelSearch, setPanelSearch] = useState('')

  const from = fromDate
  const to = toDate

  // — Derived
  const selectedCategories = useMemo(
    () => categorySpending.filter((c) => selectedCategoryIds.has(c.id)),
    [categorySpending, selectedCategoryIds]
  )

  const sortedPanelTransactions = useMemo(() => {
    let list = categoryTransactions.filter((t) =>
      t.merchant.toLowerCase().includes(panelSearch.toLowerCase())
    )
    list = [...list].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDir === 'asc'
          ? Math.abs(a.amount) - Math.abs(b.amount)
          : Math.abs(b.amount) - Math.abs(a.amount)
      }
      if (sortField === 'date') {
        return sortDir === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)
      }
      return sortDir === 'asc'
        ? a.merchant.localeCompare(b.merchant)
        : b.merchant.localeCompare(a.merchant)
    })
    return list
  }, [categoryTransactions, sortField, sortDir, panelSearch])

  // — Fetch report data whenever the date range changes; reset category filter on each fetch
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
  }, [fromDate, toDate])

  // — Budgets are date-range-independent; fetch once on mount
  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => {})
  }, [])

  // — Close category dropdown and export menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
      if (!(e.target as Element).closest('[data-export-dropdown]')) setExportOpen(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // — Handlers
  function handleSliceClick(id: string, name: string) {
    setClickedCategory({ id, name })
    setPanelSearch('')
    setSortField('amount')
    setSortDir('desc')
    getTransactionsByCategory(id, from, to).then(setCategoryTransactions)
  }

  function handleMonthClick(year: number, month: number) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${pad(month)}-01`
    const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`
    const clampedFrom = from && from > monthStart ? from : monthStart
    const clampedTo = to && to < monthEnd ? to : monthEnd
    const label = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    setClickedCategory({ id: 'month', name: label })
    setPanelSearch('')
    setSortField('date')
    setSortDir('desc')
    getMonthlyTransactions(clampedFrom, clampedTo).then(setCategoryTransactions)
  }

  function handleCashFlowClick(year: number, month: number) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${pad(month)}-01`
    const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`
    const clampedFrom = from && from > monthStart ? from : monthStart
    const clampedTo = to && to < monthEnd ? to : monthEnd
    const label = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    setClickedCategory({ id: 'cashflow', name: label })
    setPanelSearch('')
    setSortField('date')
    setSortDir('desc')
    getCashFlowTransactions(clampedFrom, clampedTo).then(setCategoryTransactions)
  }

  function handleDetailedSliceClick(id: string, name: string) {
    setClickedCategory({ id, name })
    setPanelSearch('')
    setSortField('amount')
    setSortDir('desc')
    getTransactionsByDetailedCategory(id, from, to).then(setCategoryTransactions)
  }

  function handleExport(format: 'csv' | 'xlsx', endpoint: string) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('format', format)
    window.location.href = `/api/reports/${endpoint}?${params.toString()}`
    setExportOpen(null)
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const exportBtnClass =
    'text-xs border border-line rounded-lg px-3 py-1 text-ink-3 hover:text-ink-2 hover:border-line-2 transition-colors'
  const exportMenuClass =
    'absolute right-0 top-8 z-50 w-36 bg-card border border-line rounded-xl shadow-xl overflow-hidden'
  const exportItemClass = 'w-full text-left px-4 py-2.5 text-xs text-ink-2 hover:bg-raised transition-colors'

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar px-6 py-8">
        <div className="max-w-[76rem] mx-auto space-y-8">
        <h1 className="text-xl font-semibold text-ink">Reports</h1>
        {error && <p className="text-bad text-sm">{error}</p>}

        {/* — Filter bar: date range + category multi-select */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-3 uppercase tracking-wider mr-1">From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs bg-transparent border border-line rounded-lg px-3 py-1.5 text-ink-2 focus:outline-none focus:border-line-2"
          />
          <span className="text-xs text-ink-3 uppercase tracking-wider mr-1">To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={isoDate(new Date())}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs bg-transparent border border-line rounded-lg px-3 py-1.5 text-ink-2 focus:outline-none focus:border-line-2"
          />
          <div className="h-4 w-px bg-line mx-2" />

          {/* Category multi-select dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className={`text-xs border rounded-lg px-3 py-1 transition-colors ${
                selectedCategoryIds.size > 0
                  ? 'text-s1 border-s1/40 hover:border-s1/70'
                  : 'text-ink-3 border-line hover:text-ink-2'
              }`}
            >
              {selectedCategoryIds.size > 0
                ? `Categories (${selectedCategoryIds.size})`
                : 'Categories'}{' '}
              ▾
            </button>
            {dropdownOpen && categorySpending.length > 0 && (
              <div className="absolute left-0 top-8 z-50 w-56 bg-card border border-line rounded-xl shadow-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {categorySpending.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-raised cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.has(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="accent-s1"
                      />
                      <span className="text-xs text-ink-2 truncate">
                        {formatCategoryName(c.name)}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedCategoryIds.size > 0 && (
                  <div className="border-t border-line px-4 py-2">
                    <button
                      onClick={() => setSelectedCategoryIds(new Set())}
                      className="text-xs text-ink-3 hover:text-ink-2 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="border-line" />

        {/* — Category Spending chart */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <div />
            <div className="relative" data-export-dropdown>
              <button
                onClick={() => setExportOpen((o) => (o === 'cat' ? null : 'cat'))}
                className={exportBtnClass}
              >
                Export ▾
              </button>
              {exportOpen === 'cat' && (
                <div className={exportMenuClass}>
                  <button
                    onClick={() => handleExport('csv', 'category-spending')}
                    className={exportItemClass}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx', 'category-spending')}
                    className={exportItemClass}
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          <CategorySpendingChart
            data={categorySpending}
            onSliceClick={handleSliceClick}
            selectedId={clickedCategory?.id}
          />
        </section>

        {/* — Category detail drill-down: shown only when categories are selected */}
        {selectedCategories.length > 0 && (
          <CategoryDetailCarousel
            categories={selectedCategories}
            from={from}
            to={to}
            onSliceClick={handleDetailedSliceClick}
            selectedId={clickedCategory?.id}
          />
        )}

        <hr className="border-line" />

        {/* — Monthly Spending chart */}
        <section>
          <div className="flex justify-end mb-1">
            <div className="relative" data-export-dropdown>
              <button
                onClick={() => setExportOpen((o) => (o === 'monthly' ? null : 'monthly'))}
                className={exportBtnClass}
              >
                Export ▾
              </button>
              {exportOpen === 'monthly' && (
                <div className={exportMenuClass}>
                  <button
                    onClick={() => handleExport('csv', 'monthly-spending')}
                    className={exportItemClass}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx', 'monthly-spending')}
                    className={exportItemClass}
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          <MonthlySpendingChart data={monthlySpending} onPointClick={handleMonthClick} />
        </section>

        <hr className="border-line" />

        {/* — Budget Performance + Cash Flow side by side */}
        <div className="grid grid-cols-2 gap-8">
          <section>
            <div className="mb-3">
              <h2 className="font-medium text-ink">Budget Performance</h2>
              <p className="text-xs text-ink-3 mt-0.5">Spent vs limit per budget</p>
            </div>
            <BudgetPerformanceChart data={budgets} />
          </section>

          <section>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-medium text-ink">Income vs Expenses</h2>
                <p className="text-xs text-ink-3 mt-0.5">Net cash flow per month</p>
              </div>
              <div className="relative" data-export-dropdown>
                <button
                  onClick={() => setExportOpen((o) => (o === 'cashflow' ? null : 'cashflow'))}
                  className={exportBtnClass}
                >
                  Export ▾
                </button>
                {exportOpen === 'cashflow' && (
                  <div className={exportMenuClass}>
                    <button
                      onClick={() => handleExport('csv', 'cash-flow')}
                      className={exportItemClass}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('xlsx', 'cash-flow')}
                      className={exportItemClass}
                    >
                      Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <CashFlowChart data={cashFlow} onPointClick={handleCashFlowClick} />
          </section>
        </div>
        </div>
      </main>

      {/* — Category transactions inline panel */}
      <div
        className={`flex-none border-l border-line flex flex-col overflow-hidden transition-all duration-300 ${
          clickedCategory ? 'w-[420px]' : 'w-0'
        }`}
      >
        {clickedCategory && (
          <>
            {/* Panel header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-line">
              <div>
                <h2 className="font-medium text-ink">{formatCategoryName(clickedCategory.name)}</h2>
                <p className="text-xs text-ink-3 mt-0.5">
                  {sortedPanelTransactions.length} transactions
                </p>
              </div>
              <button
                onClick={() => setClickedCategory(null)}
                className="text-ink-3 hover:text-ink-2 transition-colors mt-0.5"
              >
                ✕
              </button>
            </div>

            {/* Panel filters */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
              <input
                type="text"
                placeholder="Search..."
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                className="text-xs bg-transparent border border-line rounded-lg px-3 py-1 text-ink-2 placeholder-ink-3 focus:outline-none focus:border-line-2 w-full"
              />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'amount' | 'name' | 'date')}
                className="text-xs bg-card border border-line rounded-lg px-2 py-1 text-ink-2 focus:outline-none focus:border-line-2 shrink-0"
              >
                <option value="amount">Amount</option>
                <option value="name">Name</option>
                <option value="date">Date</option>
              </select>
              <button
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="text-xs text-ink-3 hover:text-ink-2 border border-line rounded-lg px-2 py-1 shrink-0 transition-colors"
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? '▲' : '▼'}
              </button>
            </div>

            {/* Transaction list */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[50%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-page">
                  <tr className="text-xs text-ink-3 border-b border-line">
                    <th className="text-left px-5 py-3 font-normal">Merchant</th>
                    <th className="text-left px-5 py-3 font-normal">Date</th>
                    <th className="text-right px-5 py-3 font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sortedPanelTransactions.map((t) => (
                    <tr key={t.id} className="text-ink-2 hover:bg-raised/40 transition-colors">
                      <td className="px-5 py-3 max-w-0">
                        <span
                          className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom"
                          title={t.merchant}
                        >
                          {t.merchant}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-3">{t.date}</td>
                      <td
                        className={`px-5 py-3 text-right font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
                      >
                        {formatAmount(-t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
