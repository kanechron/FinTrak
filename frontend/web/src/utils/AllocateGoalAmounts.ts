
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
    console.log("Initial goals: ", goals);
    console.log("Initial accounts: ", accounts);

    // Sort goals by priority
    const sortedGoals = goals.map(g => ({ ...g })).sort((a, b) => a.priority - b.priority);

    console.log("Initial sorted goals: ", sortedGoals);

    //For each account
    for (const acc of accounts) {
         // Skip accounts not linked to any goal
        // Allocate available balance based on goal priority
        let remaining = acc.balance;
        for (const goal of sortedGoals) {
            if (!goal.linkedAccounts.some(a => a.id === acc.id)) continue;
            console.log("First check: ", sortedGoals);
            let ta = goal.targetAmount ?? 0
            let ca = goal.currentAmount
            let gap = ta - ca

            if (gap <= 0) continue; // Goal already met

            // Allocate as much as possible to this goal
            if(remaining <= 0) break;

            const allocation = Math.min(remaining, gap);
            remaining -= allocation;

            console.log("Second check: ", sortedGoals);

            // Update the goal's current amount
            goal.currentAmount += allocation;
            console.log("Third check: ", sortedGoals);
        }
        console.log("Fourth check: ", sortedGoals);
    }
    return sortedGoals;
    
}