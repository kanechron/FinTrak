import React, { useEffect, useState } from 'react'
import { getTransactions, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import { truncate } from '../../utils/truncate'
import EditTransactionModal from '../../components/modals/EditTransactionModal'
import { getParentCategories, type Category } from '../../api/categories'
import { FilterIcon } from '../../components/common/icons'

export default function Transactions() {
  // — Data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categoryIds, setCategoryIds] = useState<Category[]>([])

  // — UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // — Filters
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [amountFilter, setAmountFilter] = useState("")
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)

  // — Data fetchers
  const fetchTransactions = () => {
    setLoading(true)
    getTransactions(fromDate?.toString(), toDate?.toString())
      .then((t) => setTransactions(t))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }

  const fetchCategories = () =>
    getParentCategories()
      .then((c) => setCategoryIds(c))
      .catch(() => setError('Failed to load categories'))

  // — On mount
  useEffect(() => {
    fetchTransactions()
    fetchCategories().finally(() => setLoading(false))
  }, [])

  // — Handlers
  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchFilter(e.target.value)
  }

  function handleDateInput(e: React.ChangeEvent<HTMLInputElement>) {
    if(e.target.name === "from") setFromDate(e.target.value || null)
    if(e.target.name === "to") setToDate(e.target.value || null)
    fetchTransactions()
  }

  useEffect(() => {
      const handler = setTimeout(() => {
        fetchTransactions()
      }, 750)
      return () => clearTimeout(handler)
  }, [fromDate, toDate])

  const inputClass =
    'text-xs bg-transparent border border-line rounded-lg px-3 py-1.5 text-ink-2 placeholder-ink-3 focus:outline-none focus:border-line-2'

  const activeFilterCount =
    (amountFilter ? 1 : 0) + (fromDate || toDate ? 1 : 0) + selectedCategoryIds.size

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8 space-y-6">
      {/* — Modals */}
      {/* Edit transaction temporarily disabled
      {selectedTransaction && (
        <EditTransactionModal
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onSuccess={() => {
            setSelectedTransaction(null)
            fetchTransactions()
          }}
        />
      )}
      */}

      {/* — Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Search merchants..."
          value={searchFilter}
          onChange={handleSearch}
          className={`${inputClass} flex-1 min-w-[140px] sm:w-48 sm:flex-none`}
        />

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-label="Toggle filters"
          className={`relative flex items-center justify-center border rounded-lg p-1.5 transition-colors ${
            activeFilterCount > 0
              ? 'text-s1 border-s1/40 hover:border-s1/70'
              : 'text-ink-3 border-line hover:text-ink-2'
          }`}
        >
          <FilterIcon />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-s1 text-white text-[10px] font-semibold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {(searchFilter || amountFilter || fromDate || toDate || selectedCategoryIds.size > 0) && (
          <button
            onClick={() => {
              setSearchFilter('')
              setAmountFilter('')
              setFromDate(null)
              setToDate(null)
              setSelectedCategoryIds(new Set())
            }}
            className="text-xs text-ink-3 hover:text-ink-2 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* — Expanded filters, inline below the search row */}
      {filtersOpen && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-raised rounded-xl p-4">
          {/* Amount */}
          <div className="flex flex-col gap-1 sm:w-40">
            <label className="text-xs text-ink-3">Amount</label>
            <input
              type="number"
              placeholder="Amount..."
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">Date range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate || ""}
                max={toDate || new Date().toISOString().split('T')[0]}
                onChange={handleDateInput}
                name="from"
                className={`${inputClass} text-ink-3`}
              />
              <input
                type="date"
                value={toDate || ""}
                max={new Date().toISOString().split('T')[0]}
                min={fromDate ?? undefined}
                onChange={handleDateInput}
                name="to"
                className={`${inputClass} text-ink-3`}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-ink-3">Categories</label>
              {selectedCategoryIds.size > 0 && (
                <button
                  onClick={() => setSelectedCategoryIds(new Set())}
                  className="text-xs text-ink-3 hover:text-ink-2 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-line rounded-lg bg-card">
              {categoryIds.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-raised cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.has(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="accent-s1"
                  />
                  <span className="text-xs text-ink-2 truncate">
                    {c.name
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (x) => x.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <hr className="border-line" />
      {/* — Transactions list */}
      <div className="overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 180px)' }}>
        {loading && <p className="px-1 py-12 text-center text-ink-3 text-sm">Loading...</p>}
        {error && <p className="px-1 py-12 text-center text-bad text-sm">{error}</p>}
        {!loading && !error && (
          <div className="divide-y divide-line">
            {transactions
              .filter(t => selectedCategoryIds.size === 0 || selectedCategoryIds.has(t.categoryId!))
              .filter(t => t.merchant.toLowerCase().includes(searchFilter.toLowerCase()))
              .filter(t => amountFilter === '' || Math.abs(t.amount) === parseFloat(amountFilter))
              .map((t) => (
                <div
                  key={t.id}
                  // onClick={() => setSelectedTransaction(t)} — edit temporarily disabled
                  className="flex items-center justify-between gap-4 py-3 px-1 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-ink font-medium truncate" title={t.merchant}>
                      {truncate(t.merchant, 32)}
                    </p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {t.date}
                      {t.pending && <span className="ml-2 text-warn">Pending</span>}
                    </p>
                  </div>
                  {/* Plaid stores debits as positive — negate for display so debits are red, credits green */}
                  <p
                    className={`shrink-0 font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
                  >
                    {formatAmount(-t.amount)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

    </main>
  )
}
