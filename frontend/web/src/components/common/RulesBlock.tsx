import { useEffect, useState } from "react";
import {
    getRulesByTarget,
    deleteRule,
    type Rule,
    type TargetType,
    updateRule
} from "../../api/rules";
import RuleForm from "./RuleForm";
import RuleCard from "./RuleCard";
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useToast } from "../../hooks/ToastProvider";

interface Props {
    target?: TargetType
}
export default function RulesBlock({ target }: Props) {
    const toast = useToast()
    // Data
    const [rules, setRules] = useState<Rule[]>([])
    const [localRules, setLocalRules] = useState<Rule[]>(rules ?? [])
    const [selectedRule, setSelectedRule] = useState<Rule | undefined>(undefined)
    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)


    // Data fetchers
    const fetchRules = () => {
        setLoading(true)
        getRulesByTarget(target!)
            .then((r) => setRules(r))
            .catch(() => setError('Failed to load rules'))
            .finally(() => setLoading(false))
    }

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
    )

    const displayRules = localRules.length > 0 ? localRules : (rules ?? [])

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = displayRules.findIndex((r) => r.id === active.id)
        const newIndex = displayRules.findIndex((r) => r.id === over.id)
        const reordered = arrayMove(displayRules, oldIndex, newIndex)
        const reorderedWithPriority = reordered.map((r, i) => ({ ...r, priority: i }))
        
        //Source of possible rule flicker issue
        try {
            await Promise.all(reorderedWithPriority.map((r) => updateRule(r.id, { ...r, priority: r.priority })))
            setLocalRules(reorderedWithPriority)
            fetchRules()
        }
        catch {
            toast.error({
                title: "Reorder unsuccessful",
                content: "Changes not saved."
            })
            fetchRules()
        }
    }

    useEffect(() => {
        if (target) fetchRules();
        else setError("No target selected")
    }, [target])

    return (
        <div className="overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 180px)' }}>
            {error && <p className="px-1 py-12 text-center text-bad text-sm">{error}</p>}
            {loading && !error && <p className="px-1 py-12 text-center text-ink-3 text-sm">Loading...</p>}
            {!loading && !error && (
                rules.length === 0 ? (
                    <p className="px-1 py-12 text-center text-ink-3 text-sm">No rules yet.</p>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={displayRules.map(r => r.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col divide-y divide-line">
                                {displayRules.map((rule) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        onClick={() => {
                                            setSelectedRule(rule)
                                            setShowForm(true)
                                        }}
                                        onDelete={(id) => {
                                            deleteRule(id).then(fetchRules)
                                        }}
                                        onUpdate={() => {
                                            fetchRules()
                                        }}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )
            )}
            {showForm &&
                <RuleForm
                    target={target!}
                    onCancel={() => {
                        setShowForm(false)
                        setSelectedRule(undefined)
                    }}
                    onSuccess={() => {
                        setShowForm(false)
                        setSelectedRule(undefined)
                        fetchRules()
                    }}
                    rule={selectedRule ?? undefined}
                    nextPriority={Math.max(0, ...rules.map(r => r.priority)) + 1}
                    ruleList={rules} />
            }
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full text-sm font-semibold text-s1 hover:opacity-80 cursor-pointer transition-opacity mt-5 pt-4 border-t border-line"
                >
                    + Add Rule
                </button>
            )}
        </div>
    )
}