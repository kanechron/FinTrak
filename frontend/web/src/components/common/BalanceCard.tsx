import { formatAmount } from '../../utils/format'

interface Account {
  name: string
  type: string
  last4: string
  balance: number
}

interface Props {
  availableBalance: number
  accounts: Account[]
}

export default function BalanceCard({ availableBalance, accounts }: Props) {
  return (
    <section>
      <p className="text-[11px] uppercase tracking-wider text-ink-3 mb-2">Available Balance</p>
      <p className="text-5xl font-bold tracking-tight text-ink">{formatAmount(availableBalance)}</p>
      <p className="text-sm text-ink-2 mt-1.5">across {accounts.length} accounts</p>
      <div className="flex flex-col divide-y divide-line mt-7">
        {accounts.map((a) => (
          <div key={a.last4} className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13px] font-medium text-ink-2">{a.name}</p>
              <p className="text-[11.5px] text-ink-3 mt-0.5">
                {a.type} · {a.last4}
              </p>
            </div>
            <p
              className={`text-lg font-semibold tabular-nums ${a.balance < 0 ? 'text-bad' : 'text-ink'}`}
            >
              {formatAmount(a.balance)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
