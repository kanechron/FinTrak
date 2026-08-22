import { 
  useState, 
  useEffect, 
  useMemo 
} from 'react'
import {
  getCategorySpending,
  getMonthlySpending,
  getCashFlow,
  getCashFlowTransactions,
  type CategorySpending,
  type CashFlow,
  getMonthlyTransactions,
  getLTERegression,
  type LTEForecastingResponse,

} from '../../api/reports'
import { 
  getBudgets, 
  type Budget 
} from '../../api/budgets'
import {
  getTransactionsByCategory,
  getTransactionsByDetailedCategory,
  type Transaction,
} from '../../api/transactions'
import CategorySpendingChart from '../../components/charts/CategorySpendingChart'
import MonthlySpendingChart, {
  type MonthlySpending,
} from '../../components/charts/MonthlySpendingChart'
import BudgetPerformanceChart from '../../components/charts/BudgetPerformanceChart'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryDetailCarousel from '../../components/charts/CategoryDetailCarousel'
import { 
  isoDate 
} from '../../utils/formatDate'
import ReportMenu from './ReportMenu'
import FilterPanel from './FilterPanel'
import TransactionPanel from './TransactionPanel'
import LTEChart from '../../components/charts/LTEChart'
import LTECategoryList from '../../components/charts/LTECategoryList'

function defaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return isoDate(d)
}

export default function Reports() {
  // — Data
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([])
  const [categoryTransactions, setCategoryTransactions] = useState<Transaction[]>([])
  const [clickedCategory, setClickedCategory] = useState<{ id: string; name: string } | null>(null)
  const [LTEPoints, setLTEPoints] = useState<LTEForecastingResponse>({
    categories: [],
    insufficientCategories: [],
  })
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleToggleLock = (categoryId: string) => {
    setLockedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // — UI state
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [catChartType, setCatChartType] = useState('Donut')
  const [monthlyChartType, setMonthlyChartType] = useState('Line')

  // — Filters
  const [fromDate, setFromDate] = useState(defaultFrom())
  const [toDate, setToDate] = useState(isoDate(new Date()))
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())

  const from = fromDate
  const to = toDate

  // — Derived
  const selectedCategories = useMemo(
    () => categorySpending.filter((c) => selectedCategoryIds.has(c.id)),
    [categorySpending, selectedCategoryIds]
  )

  // — Fetch report data whenever the date range changes; reset category filter on each fetch
  useEffect(() => {
    Promise.all([
      getCategorySpending(from, to),
      getMonthlySpending(from, to),
      getCashFlow(from, to),
      getLTERegression(),
    ])
      .then(([cat, monthly, cash, dataPoints]) => {
        setCategorySpending(cat)
        setMonthlySpending(monthly)
        setCashFlow(cash)
        setSelectedCategoryIds(new Set())
        setLTEPoints(dataPoints)
      })
      .catch(() => setError('Failed to load report data.'))
  }, [fromDate, toDate])

  // — Budgets are date-range-independent; fetch once on mount
  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => {})
  }, [])

  // — Close section menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as Element).closest('[data-report-menu]')) setMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // — Handlers
  function handleSliceClick(id: string, name: string) {
    setClickedCategory({ id, name })
    getTransactionsByCategory(id, from, to).then(setCategoryTransactions)
  }

  function handleMonthClick(year: number, month: number) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${pad(month)}-01`
    const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`
    // A clicked month's calendar boundaries can extend past the active from/to filter
    // (e.g. the report starts mid-month) — clamp so the panel never shows transactions
    // outside the range the chart itself is currently scoped to.
    const clampedFrom = from && from > monthStart ? from : monthStart
    const clampedTo = to && to < monthEnd ? to : monthEnd
    const label = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    // 'month' is a sentinel id (not a real category id) — TransactionPanel checks for it
    // to decide the panel's default sort field.
    setClickedCategory({ id: 'month', name: label })
    getMonthlyTransactions(clampedFrom, clampedTo).then(setCategoryTransactions)
  }

  function handleCashFlowClick(year: number, month: number) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${pad(month)}-01`
    const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`
    const clampedFrom = from && from > monthStart ? from : monthStart
    const clampedTo = to && to < monthEnd ? to : monthEnd
    const label = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    // 'cashflow' is the other sentinel id TransactionPanel recognizes — see handleMonthClick above.
    setClickedCategory({ id: 'cashflow', name: label })
    getCashFlowTransactions(clampedFrom, clampedTo).then(setCategoryTransactions)
  }

  function handleDetailedSliceClick(id: string, name: string) {
    setClickedCategory({ id, name })
    getTransactionsByDetailedCategory(id, from, to).then(setCategoryTransactions)
  }

  function handleExport(format: 'csv' | 'xlsx', endpoint: string) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('format', format)
    window.location.href = `/api/reports/${endpoint}?${params.toString()}`
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] overflow-hidden">
      <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar px-4 sm:px-6 py-8">
        <div className="max-w-[76rem] mx-auto space-y-8">
          <h1 className="text-xl font-semibold text-ink">Reports</h1>
          {error && <p className="text-bad text-sm">{error}</p>}

          <FilterPanel
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            categorySpending={categorySpending}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={toggleCategory}
            onClearCategories={() => setSelectedCategoryIds(new Set())}
          />

          <hr className="border-line" />

          {/* — Category Spending chart */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-medium text-ink">Category Spending</h2>
                <p className="text-xs text-ink-3 mt-0.5">Spending breakdown by category</p>
              </div>
              <ReportMenu
                isOpen={menuOpen === 'cat'}
                onToggle={() => setMenuOpen((o) => (o === 'cat' ? null : 'cat'))}
                onClose={() => setMenuOpen(null)}
                chartTypeOptions={['Donut', 'Pie', 'Bar']}
                chartType={catChartType}
                onChartTypeChange={setCatChartType}
                onExportCsv={() => handleExport('csv', 'category-spending')}
                onExportXlsx={() => handleExport('xlsx', 'category-spending')}
              />
            </div>
            <CategorySpendingChart
              data={categorySpending}
              onSliceClick={handleSliceClick}
              selectedId={clickedCategory?.id}
              chartType={catChartType}
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
              onClose={() => setSelectedCategoryIds(new Set())}
            />
          )}

          <hr className="border-line" />

          {/* — Monthly Spending chart */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-medium text-ink">Monthly Spending</h2>
                <p className="text-xs text-ink-3 mt-0.5">Total spend over selected period</p>
              </div>
              <ReportMenu
                isOpen={menuOpen === 'monthly'}
                onToggle={() => setMenuOpen((o) => (o === 'monthly' ? null : 'monthly'))}
                onClose={() => setMenuOpen(null)}
                chartTypeOptions={['Line', 'Area', 'Bar']}
                chartType={monthlyChartType}
                onChartTypeChange={setMonthlyChartType}
                onExportCsv={() => handleExport('csv', 'monthly-spending')}
                onExportXlsx={() => handleExport('xlsx', 'monthly-spending')}
              />
            </div>
            <MonthlySpendingChart
              data={monthlySpending}
              onPointClick={handleMonthClick}
              chartType={monthlyChartType}
            />
          </section>

          <hr className="border-line" />

          {/* — Budget Performance + Cash Flow side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <ReportMenu
                  isOpen={menuOpen === 'cashflow'}
                  onToggle={() => setMenuOpen((o) => (o === 'cashflow' ? null : 'cashflow'))}
                  onClose={() => setMenuOpen(null)}
                  onExportCsv={() => handleExport('csv', 'cash-flow')}
                  onExportXlsx={() => handleExport('xlsx', 'cash-flow')}
                />
              </div>
              <CashFlowChart data={cashFlow} onPointClick={handleCashFlowClick} />
            </section>
          </div>

          <hr className="border-line" />

          {/* — LTE Forecasting: full-width, chart + category list side by side */}
          <section>
            <div className="mb-3">
              <h2 className="font-medium text-ink">Predict Future Spending</h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Calculate this month's outcome per category based on past trends
              </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-3/4">
                <LTEChart data={LTEPoints} lockedIds={lockedIds} hoveredId={hoveredId} />
              </div>
              <div className="lg:w-1/4 lg:max-h-[360px] lg:overflow-y-auto">
                <LTECategoryList
                  data={LTEPoints}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  lockedIds={lockedIds}
                  onToggleLock={handleToggleLock}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <TransactionPanel
        clickedCategory={clickedCategory}
        transactions={categoryTransactions}
        onClose={() => setClickedCategory(null)}
      />
    </div>
  )
}
