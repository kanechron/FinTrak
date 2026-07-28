import type { Goal } from '../api/goals'
import type { Account } from '../api/accounts'

// Client-side only — recomputes each goal's currentAmount for display, it never writes back
// to the server. A goal's real progress is just whatever's in its linked accounts; this
// simulates how that money would be split if goals compete for the same account.
//
// For each account (independently), its balance waterfalls through goals in priority order:
// the highest-priority goal linked to that account is topped up to its target first, then
// whatever's left over falls through to the next goal, and so on until the balance or the
// goals run out. A goal linked to multiple accounts accumulates from each in turn.
export default function allocateGoalAmounts(goals: Goal[], accounts: Account[]): Goal[] {
  const sortedGoals = goals.map((g) => ({ ...g })).sort((a, b) => a.priority - b.priority)

  for (const acc of accounts) {
    let remaining = acc.balance
    for (const goal of sortedGoals) {
      if (!goal.linkedAccounts.some((a) => a.id === acc.id)) continue
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
