import { useState } from 'react'
import { parsePdf } from '../../../api/transactions'
import { type SettingsRequest } from '../../../api/settings'
import { checkboxClass } from '../../../components/modals/modalTheme'

interface Props {
  onSave: (changes: Partial<SettingsRequest>) => void
  autoSync: boolean | undefined
  inactivityTimeout: number
}

export default function General({ onSave, autoSync, inactivityTimeout }: Props) {
  const [file, setFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (selected && selected.length > 0) setFile(selected[0])
  }

  async function handleSubmit() {
    if (!file) return
    const result = await parsePdf(file)
    console.log(result)
  }

  return (
    <div>
      <p className="text-[13.5px] font-semibold text-ink mb-1">Import Bank Statement</p>
      <p className="text-[12.5px] text-ink-3 mb-4 max-w-md">
        Upload a PDF bank statement to import transactions automatically.
      </p>

      <div className="flex items-center gap-3.5">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-raised hover:bg-line-2 text-[12.5px] font-semibold text-ink-2 rounded-lg transition-colors cursor-pointer">
          <span>{file ? file.name : 'Choose PDF'}</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {file && (
          <span
            onClick={() => setFile(null)}
            className="text-[12px] text-ink-3 hover:text-ink-2 cursor-pointer transition-colors"
          >
            Clear
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-5 py-2 text-[13px] font-semibold rounded-lg bg-s1 text-white hover:opacity-90 transition-opacity"
      >
        Submit
      </button>

      <div className="border-t border-line my-8" />

      <p className="text-[13.5px] font-semibold text-ink mb-1">Auto-sync</p>
      <p className="text-[12.5px] text-ink-3 mb-4 max-w-md">
        Sync your linked accounts automatically once a day.
      </p>

      <label className="inline-flex items-center gap-3 text-sm text-ink-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoSync ?? false}
          onChange={(e) => onSave({ autoSync: e.target.checked })}
          className={checkboxClass}
        />
        Enable daily auto-sync
      </label>

      <div className="border-t border-line my-8" />

      <p className="text-[13.5px] font-semibold text-ink mb-1">Inactivity timeout</p>
      <p className="text-[12.5px] text-ink-3 mb-4 max-w-md">
        Log out automatically after this many minutes without activity.
      </p>

      <label className="inline-flex items-center gap-3 text-sm text-ink-2">
        <input
          type="number"
          min={1}
          value={inactivityTimeout}
          onChange={(e) => onSave({ inactivityTimeout: e.target.valueAsNumber })}
          className="w-20 text-xs bg-transparent border border-line rounded-lg px-3 py-1.5 text-ink-2 placeholder-ink-3 focus:outline-none focus:border-line-2"
        />
        minutes
      </label>
    </div>
  )
}
