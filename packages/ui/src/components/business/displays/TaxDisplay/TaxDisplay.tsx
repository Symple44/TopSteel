'use client'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { Badge } from '../../../data-display/badge'
import { Receipt, Percent } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface TaxItem {
  id: string
  name: string
  rate: number
  amount: number
  isInclusive?: boolean
  type: 'vat' | 'sales' | 'import' | 'excise' | 'other'
}
interface TaxDisplayProps {
  taxes: TaxItem[]
  subtotal: number
  total: number
  currency?: 'EUR' | 'USD' | 'GBP'
  variant?: 'detailed' | 'compact' | 'summary'
  showRates?: boolean
  className?: string
}
export function TaxDisplay({
  taxes,
  subtotal,
  total,
  currency = 'EUR',
  variant = 'detailed',
  showRates = true,
  className,
}: TaxDisplayProps) {
  const getTaxTypeColor = (type: TaxItem['type']) => {
    switch (type) {
      case 'vat':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'import':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'excise':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0)
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between text-sm', className)}>
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span>Taxes ({taxes.length})</span>
        </div>
        <CurrencyDisplay amount={totalTaxAmount} currency={currency} size="sm" />
      </div>
    )
  }
  if (variant === 'summary') {
    return (
      <div className={cn('space-y-2 p-3 bg-muted/50 rounded-lg', className)}>
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Sous-total</span>
          <CurrencyDisplay amount={subtotal} currency={currency} size="sm" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Total taxes</span>
          <CurrencyDisplay amount={totalTaxAmount} currency={currency} size="sm" />
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between font-semibold">
          <span>Total TTC</span>
          <CurrencyDisplay amount={total} currency={currency} />
        </div>
      </div>
    )
  }
  // Detailed variant
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Détail des taxes</h4>
      </div>
      <div className="space-y-2">
        {taxes.map((tax) => (
          <div key={tax.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTaxTypeColor(tax.type)}>
                {tax.type.toUpperCase()}
              </Badge>
              <span>{tax.name}</span>
              {showRates && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Percent className="h-3 w-3" />
                  <span>{tax.rate}%</span>
                </div>
              )}
              {tax.isInclusive && (
                <Badge variant="outline" className="text-xs">
                  Incluse
                </Badge>
              )}
            </div>
            <CurrencyDisplay amount={tax.amount} currency={currency} size="sm" />
          </div>
        ))}
      </div>
      <div className="pt-2 border-t space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Sous-total HT</span>
          <CurrencyDisplay amount={subtotal} currency={currency} size="sm" />
        </div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Total taxes</span>
          <CurrencyDisplay amount={totalTaxAmount} currency={currency} size="sm" />
        </div>
        <div className="flex items-center justify-between font-semibold border-t pt-2">
          <span>Total TTC</span>
          <CurrencyDisplay amount={total} currency={currency} />
        </div>
      </div>
    </div>
  )
}
