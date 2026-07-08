import { useState } from "react";
import { parsePdf } from "../../../api/transactions";

export default function General() {
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected && selected.length > 0) setFile(selected[0]);
  }

  async function handleSubmit() {
    if (!file) return;
    const result = await parsePdf(file);
    console.log(result);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-medium">General</h2>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Import bank statement</h3>
        <p className="text-sm text-gray-500">
          Upload a PDF bank statement to import transactions automatically.
        </p>

        <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors cursor-pointer">
          <span>{file ? file.name : "Choose PDF"}</span>

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
            className="ml-3 text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
          >
            Clear
          </span>
        )}
        <button onClick={handleSubmit}>submit</button>
      </div>
    </div>
  );
}
