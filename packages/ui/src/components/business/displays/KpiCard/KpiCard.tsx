'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { TrendIndicator } from '../TrendIndicator'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Package, 
  Clock,
  BarChart3
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface KpiData {
  id: string
  title: string
  value: number
  unit?: string
  target?: number
  previousValue?: number
  percentageChange?: number
  period: string
  category: 'financial' | 'operational' | 'customer' | 'quality' | 'production'
  format: 'currency' | 'number' | 'percentage' | 'time'
  currency?: 'EUR' | 'USD' | 'GBP'
  description?: string
  isPositiveTrend?: boolean
}
interface KpiCardProps {
  kpi: KpiData
  variant?: 'default' | 'compact' | 'detailed'
  showTrend?: boolean
  showTarget?: boolean
  className?: string
  loading?: boolean
}
export function KpiCard({
  kpi,
  variant = 'default',
  showTrend = true,
  showTarget = true,
  className,
  loading = false,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    )
  }
  const getCategoryIcon = (category: KpiData['category']) => {
    switch (category) {
      case 'financial':
        return DollarSign
      case 'operational':
        return BarChart3
      case 'customer':
        return Users
      case 'quality':
        return Target
      case 'production':
        return Package
      default:
        return BarChart3
    }
  }
  const getCategoryColor = (category: KpiData['category']) => {
    switch (category) {
      case 'financial':
        return 'text-green-600 bg-green-100'
      case 'operational':
        return 'text-blue-600 bg-blue-100'
      case 'customer':
        return 'text-purple-600 bg-purple-100'
      case 'quality':
        return 'text-orange-600 bg-orange-100'
      case 'production':
        return 'text-indigo-600 bg-indigo-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }
  const formatValue = (value: number, format: KpiData['format']) => {
    switch (format) {
      case 'currency':
        return (
          <CurrencyDisplay 
            amount={value} 
            currency={kpi.currency || 'EUR'} 
            size="lg"
            compact={value >= 10000}
          />
        )
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'time':
        if (value < 60) return `${value}min`
        if (value < 1440) return `${(value / 60).toFixed(1)}h`
        return `${(value / 1440).toFixed(1)}j`
      case 'number':
      default:
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
        return value.toLocaleString('fr-FR')
    }
  }
  const getTargetPercentage = () => {
    if (!kpi.target) return null
    return (kpi.value / kpi.target) * 100
  }
  const isOnTarget = () => {
    const targetPercentage = getTargetPercentage()
    return targetPercentage ? targetPercentage >= 90 : false
  }
  const Icon = getCategoryIcon(kpi.category)
  const colorClasses = getCategoryColor(kpi.category)
  const targetPercentage = getTargetPercentage()
  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colorClasses)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{kpi.title}</p>
              <div className="text-xl font-bold">
                {formatValue(kpi.value, kpi.format)}
                {kpi.unit && <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>}
              </div>
            </div>
          </div>
          {showTrend && kpi.percentageChange !== undefined && (
            <TrendIndicator
              value={kpi.value}
              previousValue={kpi.previousValue}
              percentage={kpi.percentageChange}
              variant="minimal"
              size="sm"
            />
          )}
        </div>
      </Card>
    )
  }
  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', colorClasses)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{kpi.title}</CardTitle>
                {kpi.description && (
                  <p className="text-sm text-muted-foreground">{kpi.description}</p>
                )}
              </div>
            </div>
            {showTrend && kpi.percentageChange !== undefined && (
              <TrendIndicator
                value={kpi.value}
                previousValue={kpi.previousValue}
                percentage={kpi.percentageChange}
                variant="detailed"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">
              {formatValue(kpi.value, kpi.format)}
              {kpi.unit && <span className="text-lg text-muted-foreground ml-2">{kpi.unit}</span>}
            </div>
            <p className="text-sm text-muted-foreground">Période: {kpi.period}</p>
          </div>
          {showTarget && kpi.target && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Objectif:</span>
                <span className="font-medium">
                  {formatValue(kpi.target, kpi.format)}
                  {kpi.unit && ` ${kpi.unit}`}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    isOnTarget() ? 'bg-green-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${Math.min(targetPercentage || 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Réalisé: {targetPercentage?.toFixed(1)}%</span>
                <span className={cn(
                  'font-medium',
                  isOnTarget() ? 'text-green-600' : 'text-blue-600'
                )}>
                  {isOnTarget() ? 'Objectif atteint' : 'En cours'}
                </span>
              </div>
            </div>
          )}
          {kpi.previousValue && (
            <div className="pt-2 border-t text-sm text-muted-foreground">
              Période précédente: {formatValue(kpi.previousValue, kpi.format)}
              {kpi.unit && ` ${kpi.unit}`}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colorClasses)}>
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{kpi.title}</CardTitle>
          </div>
          {showTrend && kpi.percentageChange !== undefined && (
            <TrendIndicator
              value={kpi.value}
              previousValue={kpi.previousValue}
              percentage={kpi.percentageChange}
              variant="simple"
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">
            {formatValue(kpi.value, kpi.format)}
            {kpi.unit && <span className="text-base text-muted-foreground ml-1">{kpi.unit}</span>}
          </div>
          <p className="text-xs text-muted-foreground">{kpi.period}</p>
        </div>
        {showTarget && kpi.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Objectif:</span>
              <span>{formatValue(kpi.target, kpi.format)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isOnTarget() ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${Math.min(targetPercentage || 0, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
