'use client'
import { cn } from '../../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { CurrencyDisplay } from '../CurrencyDisplay'
export interface CostBreakdownItem {
  id: string
  label: string
  amount: number
  percentage: number
  color?: string
  category?: 'materials' | 'labor' | 'overhead' | 'transport' | 'other'
  description?: string
}
interface CostBreakdownDisplayProps {
  items: CostBreakdownItem[]
  total: number
  title?: string
  currency?: 'EUR' | 'USD' | 'GBP'
  showPercentages?: boolean
  variant?: 'detailed' | 'compact'
  className?: string
}
export function CostBreakdownDisplay({
  items,
  total,
  title = 'Répartition des coûts',
  currency = 'EUR',
  showPercentages = true,
  variant = 'detailed',
  className,
}: CostBreakdownDisplayProps) {
  const COLORS = {
    materials: '#3b82f6',
    labor: '#10b981',
    overhead: '#f59e0b',
    transport: '#8b5cf6',
    other: '#6b7280',
  }
  const getItemColor = (item: CostBreakdownItem) => {
    return item.color || (item.category ? COLORS[item.category] : COLORS.other)
  }
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getItemColor(item) }}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {showPercentages && (
                  <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                )}
                <CurrencyDisplay amount={item.amount} currency={currency} size="sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t flex justify-between font-semibold">
          <span>Total</span>
          <CurrencyDisplay amount={total} currency={currency} size="sm" />
        </div>
      </div>
    )
  }
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <CurrencyDisplay amount={total} currency={currency} variant="muted" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getItemColor(item) }}
                  />
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {showPercentages && (
                    <span className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  )}
                  <CurrencyDisplay amount={item.amount} currency={currency} />
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: getItemColor(item),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
