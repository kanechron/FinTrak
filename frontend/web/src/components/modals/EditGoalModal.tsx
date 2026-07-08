import { useState, useEffect } from "react";
import { updateGoal, type Goal } from "../../api/goals";

interface Props {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: { id: string; name: string; balance: number }[];
}

export default function EditGoalModal({
  goal,
  isOpen,
  onClose,
  onSuccess,
  accounts,
}: Props) {
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState<number | null>(
    goal.targetAmount,
  );
  const [targetDate, setTargetDate] = useState<string | null>(goal.targetDate);
  const [linkedAccounts, setLinkedAccounts] = useState<
    { id: string; name: string }[]
  >(goal.linkedAccounts.map((a) => ({ id: a.id, name: a.name })));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when a different goal is opened
  useEffect(() => {
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setTargetDate(goal.targetDate);
    setLinkedAccounts(
      goal.linkedAccounts.map((a) => ({ id: a.id, name: a.name })),
    );
    setError(null);
  }, [goal]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !targetAmount || targetAmount <= 0) {
      setError("Please provide a valid name and target amount.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateGoal(goal.id, {
        name,
        targetAmount,
        targetDate,
        isActive: goal.isActive,
        priority: goal.priority,
        currentAmount: goal.currentAmount,
        linkedAccounts: linkedAccounts.map((a) => ({
          id: a.id,
          name: "",
          mask: "",
        })),
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAccount = (a: { id: string; name: string }) => {
    if (linkedAccounts.some((acc) => acc.id === a.id)) {
      setLinkedAccounts(linkedAccounts.filter((acc) => acc.id !== a.id));
    } else {
      setLinkedAccounts([...linkedAccounts, { id: a.id, name: a.name }]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium">Edit Goal</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Goal Name"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
        />

        <input
          value={targetAmount ?? ""}
          onChange={(e) =>
            setTargetAmount(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          type="number"
          placeholder="Target Amount"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Target Date</label>
          <input
            value={targetDate || ""}
            onChange={(e) => setTargetDate(e.target.value || null)}
            type="date"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Linked Accounts</label>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleAccount(a)}
                className={`py-1 px-2 text-sm rounded transition-colors ${
                  linkedAccounts.some((acc) => acc.id === a.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

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
