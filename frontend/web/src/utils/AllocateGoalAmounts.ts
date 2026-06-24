import type { Goal } from '../api/goals'
import type { Account } from '../api/accounts'

export default function allocateGoalAmounts(goals: Goal[], accounts: Account[]): Goal[] {
    const sortedGoals = goals.map(g => ({ ...g })).sort((a, b) => a.priority - b.priority)

    for (const acc of accounts) {
        let remaining = acc.balance
        for (const goal of sortedGoals) {
            if (!goal.linkedAccounts.some(a => a.id === acc.id)) continue
            const gap = (goal.targetAmount ?? 0) - goal.currentAmount
            if (gap <= 0) continue
            if (remaining <= 0) break
            const allocation = Math.min(remaining, gap)
            remaining -= allocation
            goal.currentAmount += allocation
        }
    }
    return sortedGoals
}
