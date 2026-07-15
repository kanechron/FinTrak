import React, { useEffect, useRef, useState } from 'react'
import { getTransactions, deleteTransaction, type Transaction } from '../../api/transactions'
import { formatAmount } from '../../utils/format'
import AddTransactionModal from '../../components/modals/AddTransactionModal'
import EditTransactionModal from '../../components/modals/EditTransactionModal'
import { getParentCategories, type Category } from '../../api/categories'

export default function Transactions() {
  // — Data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categoryIds, setCategoryIds] = useState<Category[]>([])

  // — UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // — Filters
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  // — Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // — Handlers
  async function handleDelete(id: string) {
    await deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

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

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8 space-y-6">
      {/* — Modals */}
      <AddTransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />
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

      {/* — Filters */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Search merchants..."
          value={searchFilter}
          onChange={handleSearch}
          className={`${inputClass} w-48`}
        />

        {/* Amount */}
        <input
          type="number"
          placeholder="Amount..."
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          className={`${inputClass} w-28`}
        />

        {/* Date range */}
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
        {/* Category dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
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
          {dropdownOpen && (
            <div className="absolute left-0 top-9 z-50 w-56 bg-card border border-line rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {categoryIds.map((c) => (
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
                      {c.name
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (x) => x.toUpperCase())}
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

        {/* Add transaction */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="ml-auto text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity"
        >
          + Add Transaction
        </button>
      </div>

      <hr className="border-line" />
      {/* — Transactions table */}
      <div className="overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 180px)' }}>
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[20%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="text-xs text-ink-3 border-b border-line bg-page">
              <th className="text-left px-4 py-3 font-normal">Merchant</th>
              <th className="text-left px-4 py-3 font-normal">Category</th>
              <th className="text-left px-4 py-3 font-normal">Date</th>
              <th className="text-right px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-3 text-sm">
                  Loading...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-bad text-sm">
                  {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              transactions
                .filter(t => selectedCategoryIds.size === 0 || selectedCategoryIds.has(t.categoryId!))
                .filter(t => t.merchant.toLowerCase().includes(searchFilter.toLowerCase()))
                .filter(t => amountFilter === '' || Math.abs(t.amount) === parseFloat(amountFilter))
                .map((t) => (
                  <tr
                    key={t.id}
                    className="group text-ink-2 hover:bg-raised/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <td className="px-4 py-3 text-ink font-medium max-w-0">
                      <span
                        className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom"
                        title={t.merchant}
                      >
                        {t.merchant}
                      </span>
                      {t.pending && <span className="ml-2 text-xs text-warn">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{t.category}</td>
                    <td className="px-4 py-3 text-ink-3">{t.date}</td>
                    {/* Plaid stores debits as positive — negate for display so debits are red, credits green */}
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${t.amount < 0 ? 'text-good' : 'text-bad'}`}
                    >
                      {formatAmount(-t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(t.id)
                        }}
                        className="text-ink-3 hover:text-bad transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

    </main>
  )
}
