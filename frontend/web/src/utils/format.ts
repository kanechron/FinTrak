export function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount < 0 ? `-$${abs}` : `+$${abs}`
}

export function formatCategoryName(v: string): string {
  return v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase())
}
