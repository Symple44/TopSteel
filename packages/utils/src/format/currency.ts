// packages/utils/src/format/currency.ts
export function formatCurrency(
  amount: number, 
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M €`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k €`
  }
  return formatCurrency(amount)
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
}