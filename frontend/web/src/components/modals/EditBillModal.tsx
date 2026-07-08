import { useState, useEffect } from "react";
import { updateBill, type Bill } from "../../api/bills";
import { getCategories, type Category } from "../../api/categories";

interface Props {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  "w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500";

export default function EditBillModal({
  bill,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState(bill.name);
  const [amount, setAmount] = useState<number | null>(bill.amount);
  const [frequency, setFrequency] = useState(bill.frequency);
  const [dueDay, setDueDay] = useState<number | null>(bill.dueDay);
  const [customDate, setCustomDate] = useState(bill.customDate ?? "");
  const [isAutoPay, setIsAutoPay] = useState(bill.isAutoPay);
  const [categoryId, setCategoryId] = useState<string | null>(bill.categoryId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen)
      getCategories()
        .then(setCategories)
        .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setName(bill.name);
    setAmount(bill.amount);
    setFrequency(bill.frequency);
    setDueDay(bill.dueDay);
    setCustomDate(bill.customDate ?? "");
    setIsAutoPay(bill.isAutoPay);
    setCategoryId(bill.categoryId);
    setError(null);
  }, [bill]);

  if (!isOpen) return null;

  const showDueDay = ["Monthly", "Quarterly", "Yearly"].includes(frequency);
  const showCustomDate = frequency === "Custom";

  async function handleSubmit() {
    if (!name || !amount || amount <= 0) {
      setError("Name and amount are required.");
      return;
    }
    if (showDueDay && !dueDay) {
      setError("Due day is required for this frequency.");
      return;
    }
    if (showCustomDate && !customDate) {
      setError("Custom date is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateBill(bill.id, {
        name,
        amount: amount!,
        frequency,
        dueDay: showDueDay ? dueDay : null,
        customDate: showCustomDate ? customDate : null,
        isAutoPay,
        categoryId,
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save bill.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium">Edit Bill</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Bill Name"
          className={inputClass}
        />

        <input
          value={amount ?? ""}
          onChange={(e) =>
            setAmount(e.target.value === "" ? null : Number(e.target.value))
          }
          type="number"
          placeholder="Amount"
          min={0}
          step={0.01}
          className={inputClass}
        />

        <select
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value);
            setDueDay(null);
            setCustomDate("");
          }}
          className={inputClass}
        >
          <option value="Weekly">Weekly</option>
          <option value="BiWeekly">Bi-Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
          <option value="Custom">Custom Date</option>
        </select>

        {showDueDay && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Due Day of Month</label>
            <input
              value={dueDay ?? ""}
              onChange={(e) =>
                setDueDay(e.target.value === "" ? null : Number(e.target.value))
              }
              type="number"
              placeholder="e.g. 15"
              min={1}
              max={28}
              className={inputClass}
            />
          </div>
        )}

        {showCustomDate && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Due Date</label>
            <input
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              type="date"
              className={inputClass}
            />
          </div>
        )}

        <select
          size={5}
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className={`${inputClass} max-h-36 overflow-y-auto`}
        >
          <option value="">No Category</option>
          {categories
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (ch) => ch.toUpperCase())}
              </option>
            ))}
        </select>

        <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
          <div
            onClick={() => setIsAutoPay((p) => !p)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${isAutoPay ? "bg-emerald-500" : "bg-gray-700"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAutoPay ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          Auto-pay
        </label>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
