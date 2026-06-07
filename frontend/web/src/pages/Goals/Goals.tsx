import { useEffect, useState } from 'react'
import { getGoals, deleteGoal, updateGoal, type Goal } from '../../api/goals'
import { getAccounts, type Account } from '../../api/accounts'
import { formatAmount } from '../../utils/format'
import ProgressBar from '../../components/common/ProgressBar'
import AddGoalModal from '../../components/modals/AddGoalModal'
import EditGoalModal from '../../components/modals/EditGoalModal'
import allocateGoalAmounts from '../../utils/AllocateGoalAmounts'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import SortableGoal from '../../components/dashboard/SortableGoal'

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allocatedGoals, setAllocatedGoals] = useState<Goal[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const fetchGoals = async () => {
    const [g, a] = await Promise.all([getGoals(), getAccounts()])
    setGoals(g)
    setAccounts(a)
    setAllocatedGoals(allocateGoalAmounts(g, a))
  }

  useEffect(() => { fetchGoals() }, [])

  const availableBalance = accounts.reduce((sum, a) => sum + (a.balance < 0 ? 0 : a.balance), 0)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id)
      fetchGoals()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = allocatedGoals.findIndex(g => g.id === active.id)
    const newIndex = allocatedGoals.findIndex(g => g.id === over.id)
    const reordered = arrayMove(allocatedGoals, oldIndex, newIndex)
    const reorderedWithPriority = reordered.map((g, i) => ({ ...g, priority: i }))

    setAllocatedGoals(reorderedWithPriority)
    await Promise.all(reorderedWithPriority.map(g => updateGoal(g.id, { priority: g.priority })))
    fetchGoals()
  }

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <AddGoalModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchGoals} accounts={accounts} />
      {selectedGoal && (
        <EditGoalModal
          goal={selectedGoal}
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onSuccess={() => { setSelectedGoal(null); fetchGoals() }}
          accounts={accounts}
        />
      )}

      {/* Balance summary */}
      <section className="border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-3xl font-bold tracking-tight">{formatAmount(availableBalance)}</p>
          <p className="text-sm text-gray-500 mt-1">across {accounts.length} accounts</p>
        </div>
        <div className="flex gap-6">
          {accounts.map(a => (
            <div key={a.last4} className="text-right">
              <p className="text-sm text-gray-300">{a.name}</p>
              <p className={`text-sm font-medium ${a.balance < 0 ? 'text-red-400' : ''}`}>{formatAmount(a.balance)}</p>
              <p className="text-xs text-gray-600">{a.type} · {a.last4}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Goals list */}
      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-medium">Goals</h2>
          <button onClick={() => setAddModalOpen(true)} className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer">
            + Add Goal
          </button>
        </div>
        <div className="p-5 space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={allocatedGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
              {allocatedGoals.map(g => (
                <SortableGoal key={g.id} goal={g} onDelete={handleDelete} onClick={() => setSelectedGoal(g)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </section>

    </main>
  )
}
