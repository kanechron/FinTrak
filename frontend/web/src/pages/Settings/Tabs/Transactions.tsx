import RulesBlock from '../../../components/common/RulesBlock'
import { type SettingsRequest } from '../../../api/settings'

const PAGE_SIZES = [25, 50, 100, 200]

interface Props {
  onSave: (changes: Partial<SettingsRequest>) => void
  transactionPageSize: number
}

export default function Transactions({ onSave, transactionPageSize }: Props) {
  const target = 'Transaction'
  return (
    <>
      <p className="text-[13.5px] font-semibold text-ink mb-1">Transactions per page</p>
      <p className="text-[12.5px] text-ink-3 mb-4 max-w-md">
        How many transactions load at a time on the Transactions page.
      </p>

      <select
        value={transactionPageSize}
        onChange={(e) => onSave({ transactionPageSize: Number(e.target.value) })}
        className="w-24 text-xs bg-transparent border border-line rounded-lg px-3 py-1.5 text-ink-2 focus:outline-none focus:border-line-2"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size} className="bg-card">
            {size}
          </option>
        ))}
      </select>

      <div className="border-t border-line my-8" />

      <RulesBlock target={target} />
    </>
  )
}
