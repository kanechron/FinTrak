import ProgressBar from '../common/ProgressBar'

interface Budget {
  category: string
  spent: number
  limit: number
}

interface Props {
  budgets: Budget[]
}

export default function BudgetList({ budgets }: Props) {
  return (
    <section className="col-span-2 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-medium">Budgets</h2>
      <div className="space-y-4">
        {budgets.map((b) => (
          <div key={b.category} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{b.category}</span>
              <span className="text-gray-500">${b.spent} / ${b.limit}</span>
            </div>
            <ProgressBar value={b.spent} max={b.limit} />
          </div>
        ))}
      </div>
    </section>
  )
}
