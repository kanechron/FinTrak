import { useEffect, useState } from "react";
import { getBudgets, deleteBudget, type Budget } from "../../api/budgets";
import { getAccounts, type Account } from "../../api/accounts";
import { formatAmount } from "../../utils/format";
import { formatDate } from "../../utils/formatDate";
import ProgressBar from "../../components/common/ProgressBar";
import AddBudgetModal from "../../components/modals/AddBudgetModal";
import EditBudgetModal from "../../components/modals/EditBudgetModal";

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const fetchBudgets = () => getBudgets().then(setBudgets);

  useEffect(() => {
    fetchBudgets();
    getAccounts().then(setAccounts);
  }, []);

  const availableBalance = accounts.reduce(
    (sum, a) => sum + (a.balance < 0 ? 0 : a.balance),
    0,
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteBudget(id);
      fetchBudgets();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <AddBudgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchBudgets}
      />
      {selectedBudget && (
        <EditBudgetModal
          budget={selectedBudget}
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onSuccess={() => {
            setSelectedBudget(null);
            fetchBudgets();
          }}
        />
      )}

      {/* Balance summary */}
      <section className="border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Available Balance
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {formatAmount(availableBalance)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            across {accounts.length} accounts
          </p>
        </div>
        <div className="flex gap-6">
          {accounts.map((a) => (
            <div key={a.last4} className="text-right">
              <p className="text-sm text-gray-300">{a.name}</p>
              <p
                className={`text-sm font-medium ${a.balance < 0 ? "text-red-400" : ""}`}
              >
                {formatAmount(a.balance)}
              </p>
              <p className="text-xs text-gray-600">
                {a.type} · {a.last4}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Budget list */}
      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-medium">Budgets</h2>
          <button
            onClick={() => setAddModalOpen(true)}
            className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer"
          >
            + Add Budget
          </button>
        </div>
        <div className="divide-y divide-gray-900">
          {budgets.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-12">
              No budgets yet — add one to get started.
            </p>
          )}
          {budgets.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBudget(b)}
              className="px-5 py-4 space-y-2 hover:bg-gray-900/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 font-medium">{b.name}</span>
                  {b.isRecurring && (
                    <span className="text-xs text-emerald-400 border border-emerald-800 rounded px-1.5 py-0.5">
                      Recurring
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    {formatAmount(b.spent)} / {formatAmount(b.amount)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, b.id)}
                    className="text-red-500 hover:text-red-400 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {b.category && (
                <p className="text-xs text-gray-400">
                  {b.category
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {b.period} · {formatDate(b.startDate)} – {formatDate(b.endDate)}
              </p>
              <ProgressBar value={b.spent} max={b.amount} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
