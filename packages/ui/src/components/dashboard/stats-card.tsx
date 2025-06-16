// packages/ui/src/components/dashboard/stats-card.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../base/card'
import { Badge } from '../base/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@erp/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  subtitle?: string
  icon?: React.ReactNode
  format?: 'currency' | 'number' | 'percentage'
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  subtitle,
  icon,
  format = 'number',
  className 
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency': return formatCurrency(val)
      case 'percentage': return formatPercentage(val)
      default: return val.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600 bg-green-50'
      case 'decrease': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        
        <div className="flex items-center justify-between mt-2">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <Badge variant="outline" className={getTrendColor()}>
                {change > 0 ? '+' : ''}{formatPercentage(change, 1)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}