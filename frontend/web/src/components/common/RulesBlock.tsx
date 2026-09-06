import { useEffect, useState } from "react";
import { getRulesByTarget, type Rule, type TargetType } from "../../api/rules";
import RuleForm from "./RuleForm";

interface Props {
    target?: TargetType
}
export default function RulesBlock({ target } : Props) {
    // Data
    const [rules, setRules] = useState<Rule[]>([])

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

    if(!target) {
        setError('No available rules')
    }
    else {
        useEffect(() => {
            fetchRules()
        }, [])
    }

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
                            <div key={rule.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-[13px] font-medium text-ink-2">{rule.ruleName}</p>
                                    <p className="text-[11.5px] text-ink-3 mt-0.5">
                                        Priority {rule.priority} · {rule.conditions.length} condition
                                        {rule.conditions.length === 1 ? '' : 's'} · {rule.actions.length} action
                                        {rule.actions.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <span
                                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${rule.isActive ? 'text-good bg-good/15' : 'text-ink-3 bg-raised'
                                        }`}
                                >
                                    {rule.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        ))}
                    </div>
                )
            )}
            {showForm && <RuleForm target={target!} onCancel={() => setShowForm(false)} />}
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