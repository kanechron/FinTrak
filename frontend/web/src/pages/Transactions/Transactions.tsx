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

  // — Derived
  // const selectedCategories = useMemo(
  //   () => categoryIds.filter((c) => selectedCategoryIds.has(c.id)),
  //   [categoryIds, selectedCategoryIds]
  // )

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

  return (
    <main className="px-6 py-8 space-y-6">
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
          className="text-xs bg-transparent border border-gray-800 rounded-md px-3 py-1 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-48"
        />

        {/* Amount */}
        <input
          type="number"
          placeholder="Amount..."
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          className="text-xs bg-transparent border border-gray-800 rounded-md px-3 py-1 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-28"
        />

        {/* Date range */}
        <input
          type="date"
          value={fromDate || ""}
          max={toDate || new Date().toISOString().split('T')[0]}
          onChange={handleDateInput}
          name="from"
          className="text-xs bg-transparent border border-gray-800 rounded-md px-3 py-1 text-gray-500 focus:outline-none focus:border-gray-600"
        />
          <input
            type="date"
            value={toDate || ""}
            max={new Date().toISOString().split('T')[0]}
            min={fromDate ?? undefined}
            onChange={handleDateInput}
            name="to"
            className="text-xs bg-transparent border border-gray-800 rounded-md px-3 py-1 text-gray-500 focus:outline-none focus:border-gray-600"
          />
        {/* Category dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`text-xs border rounded-md px-3 py-1 transition-colors ${
              selectedCategoryIds.size > 0
                ? 'text-purple-400 border-purple-700 hover:border-purple-500'
                : 'text-gray-500 border-gray-800 hover:text-gray-300'
            }`}
          >
            {selectedCategoryIds.size > 0
              ? `Categories (${selectedCategoryIds.size})`
              : 'Categories'}{' '}
            ▾
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-8 z-50 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {categoryIds.map((c) => (
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
                      {c.name
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (x) => x.toUpperCase())}
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
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}

        {/* Add transaction */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="ml-auto text-sm text-blue-500 hover:text-blue-400 cursor-pointer"
        >
          + Add Transaction
        </button>
      </div>

      <hr className="border-gray-800" />
      {/* — Transactions table */}
      <div className="overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 180px)' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-xs text-gray-500 border-b border-gray-800 bg-[#090F1C]/100">
              <th className="text-left px-4 py-3 font-normal">Merchant</th>
              <th className="text-left px-4 py-3 font-normal">Category</th>
              <th className="text-left px-4 py-3 font-normal">Date</th>
              <th className="text-right px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-600 text-sm">
                  Loading...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-red-500 text-sm">
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
                    className="text-gray-300 hover:bg-gray-900/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <td className="px-4 py-3">
                      {t.merchant}
                      {t.pending && <span className="ml-2 text-xs text-yellow-500">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.category}</td>
                    <td className="px-4 py-3 text-gray-500">{t.date}</td>
                    {/* Plaid stores debits as positive — negate for display so debits are red, credits green */}
                    <td
                      className={`px-4 py-3 text-right font-mono ${t.amount < 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {formatAmount(-t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(t.id)
                        }}
                        className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
