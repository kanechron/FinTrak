import { useEffect, useState } from 'react'
import { getGoals, type Goal } from '../../api/goals'
import { getAccounts, type Account } from '../../api/accounts'
import BalanceCard from '../../components/common/BalanceCard'
import GoalList from '../../components/common/GoalList'
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

  // Credit card / loan balances are negative (debt) and shouldn't reduce "available to
  // allocate" toward goals — only positive (asset) balances count toward this total.
  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)

  return (
    <main className="max-w-[76rem] mx-auto px-3 py-8">
      <BalanceCard availableBalance={availableBalance} accounts={accounts} />

      <hr className="border-line my-12" />

      <GoalList goals={allocatedGoals} onGoalAdded={fetchGoals} accounts={accounts} />
    </main>
  )
}
