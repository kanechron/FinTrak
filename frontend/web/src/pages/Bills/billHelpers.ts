import type { Bill } from '../../api/bills'

export function dueDateLabel(bill: Bill): string {
  if (!bill.nextDueDate) return '—'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.nextDueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff}d`
}

export function dueDateDiff(bill: Bill): number | null {
  if (!bill.nextDueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.nextDueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export type Urgency = 'overdue' | 'soon' | 'normal'

export function urgency(diff: number | null): Urgency {
  if (diff === null) return 'normal'
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'soon'
  return 'normal'
}

export const stripeClass: Record<Urgency, string> = {
  overdue: 'bg-bad',
  soon: 'bg-warn',
  normal: 'bg-transparent',
}

export function formatFrequency(f: string): string {
  switch (f) {
    case 'BiWeekly':
      return 'Bi-Weekly'
    default:
      return f
  }
}

export function monthlyEquivalent(bill: Bill): number {
  switch (bill.frequency) {
    // 4.33 and 2.17 are the average number of weekly/bi-weekly periods per month (52 / 12),
    // not a rounded "4 weeks" — a plain x4 would understate the true monthly cost.
    case 'Weekly':
      return bill.amount * 4.33
    case 'BiWeekly':
      return bill.amount * 2.17
    case 'Monthly':
      return bill.amount
    case 'Quarterly':
      return bill.amount / 3
    case 'Yearly':
      return bill.amount / 12
    default:
      return bill.amount
  }
}
