import { useState } from 'react'
import { parsePdf } from '../../../api/transactions'

export default function General() {
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
      <h2 className="font-semibold text-[15px] text-ink mb-5">General</h2>

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
    </div>
  )
}
