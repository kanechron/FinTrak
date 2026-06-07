// DEV REMINDERS — remove before shipping to production

const reminders = [
  'Merchant name inference: for TRANSFER_OUT transactions with no MerchantName, infer name from Amount + CategoryId (e.g. recurring fixed-amount transfers → match against known bills like rent)',
]

export default function ReminderBar() {
  if (reminders.length === 0) return null

  return (
    <div className="bg-purple-950/40 border-b border-purple-800/50 px-6 py-2 space-y-1">
      {reminders.map((r, i) => (
        <p key={i} className="text-xs text-purple-400">
          <span className="font-semibold mr-2">DEV</span>{r}
        </p>
      ))}
    </div>
  )
}
