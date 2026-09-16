import { useEffect, useState } from "react";
import {
    getRulesByTarget,
    deleteRule,
    type Rule,
    type TargetType
} from "../../api/rules";
import RuleForm from "./RuleForm";
import RuleCard from "./RuleCard";

interface Props {
    target?: TargetType
}
export default function RulesBlock({ target }: Props) {
    // Data
    const [rules, setRules] = useState<Rule[]>([])
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

    useEffect(() => {
        if(target) fetchRules();
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
                    <div className="flex flex-col divide-y divide-line">
                        {rules.map((rule) => (
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
                    nextPriority={Math.max(0, ...rules.map(r => r.priority)) + 1} />
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