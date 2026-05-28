
export default function allocateGoalAmounts(
    goals: {
    id: string
    name: string
    targetAmount: number | null
    currentAmount: number
    priority: number
    targetDate: string | null
    isActive: boolean
    linkedAccounts: { id: string }[]
}[],
    accounts: {
        id: string
        balance: number
    }[]

    
)
{
    

    // Sort goals by priority
    const sortedGoals = goals.map(g => ({ ...g })).sort((a, b) => a.priority - b.priority);


    //For each account
    for (const acc of accounts) {
         // Skip accounts not linked to any goal
        // Allocate available balance based on goal priority
        let remaining = acc.balance;
        for (const goal of sortedGoals) {
            if (!goal.linkedAccounts.some(a => a.id === acc.id)) continue;
            let ta = goal.targetAmount ?? 0
            let ca = goal.currentAmount
            let gap = ta - ca

            if (gap <= 0) continue; // Goal already met

            // Allocate as much as possible to this goal
            if(remaining <= 0) break;

            const allocation = Math.min(remaining, gap);
            remaining -= allocation;


            // Update the goal's current amount
            goal.currentAmount += allocation;
        }
    }
    return sortedGoals;
    
}