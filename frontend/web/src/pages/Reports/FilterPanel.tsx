import { useState } from 'react'
import { type CategorySpending } from '../../api/reports'
import { FilterIcon } from '../../components/common/icons'
import { formatCategoryName } from '../../utils/format'
import { isoDate } from '../../utils/formatDate'

interface Props {
  fromDate: string
  toDate: string
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
  categorySpending: CategorySpending[]
  selectedCategoryIds: Set<string>
  onToggleCategory: (id: string) => void
  onClearCategories: () => void
}

export default function FilterPanel({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  categorySpending,
  selectedCategoryIds,
  onToggleCategory,
  onClearCategories,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      {/* — Filter bar: filter toggle */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-label="Toggle filters"
          className={`relative flex items-center justify-center border rounded-lg p-1.5 transition-colors ${
            selectedCategoryIds.size > 0
              ? 'text-s1 border-s1/40 hover:border-s1/70'
              : 'text-ink-3 border-line hover:text-ink-2'
          }`}
        >
          <FilterIcon />
          {selectedCategoryIds.size > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-s1 text-white text-[10px] font-semibold flex items-center justify-center">
              {selectedCategoryIds.size}
            </span>
          )}
        </button>
      </div>

      {/* — Expanded filters, inline below the filter toggle */}
      {filtersOpen && (
        <div className="bg-raised rounded-xl p-4 space-y-4">
          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">Date range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="text-xs bg-card border border-line rounded-lg px-3 py-1.5 text-ink-2 focus:outline-none focus:border-line-2"
              />
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={isoDate(new Date())}
                onChange={(e) => onToDateChange(e.target.value)}
                className="text-xs bg-card border border-line rounded-lg px-3 py-1.5 text-ink-2 focus:outline-none focus:border-line-2"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-ink-3">Categories</label>
              {selectedCategoryIds.size > 0 && (
                <button
                  onClick={onClearCategories}
                  className="text-xs text-ink-3 hover:text-ink-2 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            {categorySpending.length === 0 ? (
              <p className="text-xs text-ink-3">No categories in this date range.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-line rounded-lg bg-card">
                {categorySpending.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-raised cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.has(c.id)}
                      onChange={() => onToggleCategory(c.id)}
                      className="accent-s1"
                    />
                    <span className="text-xs text-ink-2 truncate">
                      {formatCategoryName(c.name)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
