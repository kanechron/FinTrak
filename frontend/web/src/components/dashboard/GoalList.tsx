import AddGoalModal from "../modals/AddGoalModal";
import ProgressBar from "../common/ProgressBar";
import { useState, useEffect } from "react";
import { deleteGoal, updateGoal, type Goal } from "../../api/goals";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
    goals: Goal[] | null
    onGoalAdded: () => void
    accounts: { id: string, name: string, balance: number }[]
}

function SortableGoal({ goal, onDelete }: { goal: Goal, onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span {...attributes} {...listeners} className="cursor-grab text-gray-600 hover:text-gray-400 select-none">⠿</span>
                    <span className="text-gray-300">{goal.name}</span>
                </div>
                <span className="text-gray-500 text-sm">{goal.linkedAccounts.length} linked accounts</span>
                <div className="flex items-center gap-3">
                    <span className="text-gray-500">${goal.currentAmount} / ${goal.targetAmount}</span>
                    <button onClick={() => onDelete(goal.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
            </div>
            <ProgressBar value={goal.currentAmount} max={goal.targetAmount!} />
        </div>
    );
}

export default function GoalList({ goals = [], onGoalAdded, accounts }: Props) {
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [localGoals, setLocalGoals] = useState<Goal[]>(goals ?? []);

    useEffect(() => {
        setLocalGoals(goals ?? []);
    }, [goals]);

    const sensors = useSensors(useSensor(PointerSensor));
    const displayGoals = localGoals.length > 0 ? localGoals : (goals ?? []);

    const handleDelete = async (goalId: string) => {
        try {
            await deleteGoal(goalId);
            onGoalAdded();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    };

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = displayGoals.findIndex(g => g.id === active.id);
        const newIndex = displayGoals.findIndex(g => g.id === over.id);
        const reordered = arrayMove(displayGoals, oldIndex, newIndex);
        const reorderedWithPriority = reordered.map((g, i) => ({ ...g, priority: i }));

        setLocalGoals(reorderedWithPriority);

        await Promise.all(
            reorderedWithPriority.map((g) => updateGoal(g.id, { priority: g.priority })),
        );
        onGoalAdded(); // Refresh data after reordering
    }

    return (
        <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-medium">Goals</h2>
                <button className="text-md text-blue-500 hover:text-blue-400 cursor-pointer"
                    onClick={() => setIsGoalModalOpen(true)}>
                    + Add Goal
                </button>
            </div>
            <AddGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSuccess={() => {
                    setIsGoalModalOpen(false);
                    onGoalAdded();
                }}
                accounts={accounts}
            />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {displayGoals.map((g) => (
                            <SortableGoal key={g.id} goal={g} onDelete={handleDelete} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </section>
    );
}
