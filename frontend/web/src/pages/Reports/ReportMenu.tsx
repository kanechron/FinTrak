import { KebabIcon } from '../../components/common/icons'

const menuItemClass =
  'w-full text-left px-4 py-2.5 text-xs text-ink-2 hover:bg-raised transition-colors'

interface Props {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  chartTypeOptions?: string[]
  chartType?: string
  onChartTypeChange?: (v: string) => void
  onExportCsv: () => void
  onExportXlsx: () => void
}

export default function ReportMenu({
  isOpen,
  onToggle,
  onClose,
  chartTypeOptions,
  chartType,
  onChartTypeChange,
  onExportCsv,
  onExportXlsx,
}: Props) {
  return (
    <div className="relative" data-report-menu>
      <button
        onClick={onToggle}
        aria-label="More options"
        className="text-ink-3 hover:text-ink-2 transition-colors p-1"
      >
        <KebabIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-40 bg-card border border-line rounded-xl shadow-xl overflow-hidden">
          {chartTypeOptions && (
            <>
              <p className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-ink-3">
                View as
              </p>
              {chartTypeOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChartTypeChange?.(opt)
                    onClose()
                  }}
                  className={`${menuItemClass} flex items-center justify-between`}
                >
                  {opt}
                  {chartType === opt && <span className="text-s1">✓</span>}
                </button>
              ))}
              <div className="border-t border-line my-1" />
            </>
          )}
          <button
            onClick={() => {
              onExportCsv()
              onClose()
            }}
            className={menuItemClass}
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              onExportXlsx()
              onClose()
            }}
            className={menuItemClass}
          >
            Export Excel
          </button>
        </div>
      )}
    </div>
  )
}
