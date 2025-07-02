// packages/utils/src/calculation/index.ts
export function calculateTaxAmount(amountHT: number, taxRate: number): number {
  return amountHT * (taxRate / 100)
}

export function calculateTotalWithTax(amountHT: number, taxRate: number): number {
  return amountHT + calculateTaxAmount(amountHT, taxRate)
}

export function calculateMargin(sellPrice: number, costPrice: number): number {
  return ((sellPrice - costPrice) / sellPrice) * 100
}

export function roundToDecimals(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
