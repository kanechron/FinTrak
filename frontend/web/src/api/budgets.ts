import { api } from "./client";

export interface Budget {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isRecurring: boolean;
  spent: number;
  period: string;
  categoryId: string | null;
  category: string | null;
  amount: number;
  recurringDate: string | null;
}

export function getBudgets(): Promise<Budget[]> {
  return api.get<Budget[]>("/budgets/get-budgets");
}

export function addBudget(
  budget: Omit<Budget, "id" | "spent" | "category">,
): Promise<void> {
  return api.post("/budgets/add-budget", budget);
}

export function updateBudget(
  id: string,
  budget: Partial<Omit<Budget, "id" | "spent">>,
): Promise<void> {
  return api.patch(`/budgets/update-budget/${id}`, budget);
}

export function deleteBudget(id: string): Promise<void> {
  return api.delete(`/budgets/delete-budget/${id}`);
}
