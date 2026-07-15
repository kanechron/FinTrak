import { useEffect, useState } from 'react'
import { getGoals, type Goal } from '../../api/goals'
import { getAccounts, type Account } from '../../api/accounts'
import BalanceCard from '../../components/dashboard/BalanceCard'
import GoalList from '../../components/dashboard/GoalList'
import allocateGoalAmounts from '../../utils/AllocateGoalAmounts'

export default function Goals() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allocatedGoals, setAllocatedGoals] = useState<Goal[]>([])

  const fetchGoals = async () => {
    const [g, a] = await Promise.all([getGoals(), getAccounts()])
    setAccounts(a)
    setAllocatedGoals(allocateGoalAmounts(g, a))
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <BalanceCard availableBalance={availableBalance} accounts={accounts} />

      <hr className="border-line my-12" />

      <GoalList goals={allocatedGoals} onGoalAdded={fetchGoals} accounts={accounts} />
    </main>
  )
}
