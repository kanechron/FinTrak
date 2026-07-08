import { useState } from "react";
import { deleteBudget, type Budget } from "../../api/budgets";
import AddBudgetModal from "../modals/AddBudgetModal";
import EditBudgetModal from "../modals/EditBudgetModal";
import BudgetCard from "./BudgetCard";

interface Props {
  budgets: Budget[];
  onBudgetAdded: () => void;
}

export default function BudgetList({ budgets, onBudgetAdded }: Props) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      onBudgetAdded();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  return (
    <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
      <AddBudgetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={onBudgetAdded}
      />
      {selectedBudget && (
        <EditBudgetModal
          budget={selectedBudget}
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onSuccess={() => {
            setSelectedBudget(null);
            onBudgetAdded();
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Budgets</h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="text-md text-blue-500 hover:text-blue-400 cursor-pointer"
        >
          + Add Budget
        </button>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No budgets yet — add one to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onDelete={handleDelete}
              onClick={() => setSelectedBudget(b)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
