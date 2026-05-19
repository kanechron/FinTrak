import { formatAmount } from '../utils/format'

interface Account {
  name: string
  type: string
  last4: string
  balance: number
}

interface Props {
  totalBalance: number
  accounts: Account[]
}

export default function BalanceCard({ totalBalance, accounts }: Props) {
  return (
    <div className="col-span-1 border border-gray-800 rounded-xl p-8 flex flex-col justify-start">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Balance</p>
      <p className="text-5xl font-bold tracking-tight">{formatAmount(totalBalance)}</p>
      <p className="text-sm text-gray-500 mt-2">across {accounts.length} accounts</p>
      <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
        {accounts.map((a) => (
          <div key={a.last4} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">{a.name}</p>
              <p className={`text-sm font-medium ${a.balance < 0 ? 'text-red-400' : ''}`}>
                {formatAmount(a.balance)}
              </p>
            </div>
            <p className="text-xs text-gray-500">{a.type} · {a.last4}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
