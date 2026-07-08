import { api } from "./client";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  targetDate: string | null;
  isActive: boolean;
  priority: number;
  linkedAccounts: { id: string; name: string; mask: string }[];
}

export function getGoals() {
  return api.get<Goal[]>("/goals/get-goals");
}

export type GoalRequest = Omit<Goal, "id" | "linkedAccounts"> & {
  linkedAccounts: { id: string }[];
};

export function addGoal(goal: GoalRequest) {
  return api.post<Goal>("/goals/add-goal", goal);
}

export function updateGoal(id: string, updates: Partial<Omit<Goal, "id">>) {
  return api.patch<Goal>(`/goals/update-goal/${id}`, updates);
}

export function deleteGoal(id: string) {
  return api.delete(`/goals/delete-goal/${id}`);
}
