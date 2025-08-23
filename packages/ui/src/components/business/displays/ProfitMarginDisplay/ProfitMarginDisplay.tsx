'use client'
import { Badge } from '../../../data-display/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calculator,
  Percent,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface ProfitMarginData {
  id: string
  name: string
  current: {
    revenue: number
    cost: number
    profit: number
    marginPercentage: number
  }
  previous?: {
    revenue: number
    cost: number
    profit: number
    marginPercentage: number
  }
  target?: {
    marginPercentage: number
    profit: number
  }
  benchmark?: {
    industry: number
    company: number
  }
  breakdown?: {
    materialCosts: number
    laborCosts: number
    overheadCosts: number
    otherCosts: number
  }
  currency: string
  period: {
    start: Date
    end: Date
    label: string
  }
  category?: 'product' | 'project' | 'division' | 'total'
  threshold?: {
    excellent: number
    good: number
    warning: number
  }
}
interface ProfitMarginDisplayProps {
  data: ProfitMarginData
  variant?: 'detailed' | 'compact' | 'gauge' | 'trend'
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  showTarget?: boolean
  showTrend?: boolean
  showBenchmark?: boolean
  className?: string
  loading?: boolean
}
export function ProfitMarginDisplay({ 
  data,
  variant = 'detailed',
  size = 'md',
  showBreakdown = true,
  showTarget = true,
  showTrend = true,
  showBenchmark = false,
  className,
  loading = false
}: ProfitMarginDisplayProps) {
  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
        {showBreakdown && (
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        )}
      </div>
    )
  }
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const formatPercentage = (value: number, precision: number = 1) => {
    return `${value.toFixed(precision)}%`
  }
  const getMarginLevel = () => {
    if (!data.threshold) return 'neutral'
    const { excellent, good, warning } = data.threshold
    const margin = data.current.marginPercentage
    if (margin >= excellent) return 'excellent'
    if (margin >= good) return 'good'
    if (margin >= warning) return 'warning'
    return 'poor'
  }
  const getMarginColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }
  const getMarginBgColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-100 border-green-200'
      case 'good':
        return 'bg-blue-100 border-blue-200'
      case 'warning':
        return 'bg-yellow-100 border-yellow-200'
      case 'poor':
        return 'bg-red-100 border-red-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }
  const getTrendData = () => {
    if (!data.previous) return null
    const marginChange = data.current.marginPercentage - data.previous.marginPercentage
    const profitChange = ((data.current.profit - data.previous.profit) / data.previous.profit) * 100
    return {
      marginChange,
      profitChange,
      direction: marginChange > 0 ? 'up' : marginChange < 0 ? 'down' : 'neutral'
    }
  }
  const getTargetProgress = () => {
    if (!data.target) return null
    const marginProgress = data.target.marginPercentage > 0 
      ? (data.current.marginPercentage / data.target.marginPercentage) * 100 
      : 0
    const profitProgress = data.target.profit > 0 
      ? (data.current.profit / data.target.profit) * 100 
      : 0
    return {
      marginProgress: Math.min(marginProgress, 100),
      profitProgress: Math.min(profitProgress, 100),
      marginAchieved: data.current.marginPercentage >= data.target.marginPercentage,
      profitAchieved: data.current.profit >= data.target.profit
    }
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          title: 'text-sm',
          value: 'text-lg',
          label: 'text-xs',
          icon: 'h-3 w-3'
        }
      case 'lg':
        return {
          container: 'p-6',
          title: 'text-lg',
          value: 'text-3xl',
          label: 'text-sm',
          icon: 'h-5 w-5'
        }
      default:
        return {
          container: 'p-4',
          title: 'text-base',
          value: 'text-2xl',
          label: 'text-sm',
          icon: 'h-4 w-4'
        }
    }
  }
  const marginLevel = getMarginLevel()
  const trendData = getTrendData()
  const targetProgress = getTargetProgress()
  const sizeClasses = getSizeClasses()
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between p-3 border rounded-lg', getMarginBgColor(marginLevel), className)}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded">
            <Percent className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium">{data.name}</p>
            <p className="text-xs text-muted-foreground">{data.period.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('font-bold text-lg', getMarginColor(marginLevel))}>
            {formatPercentage(data.current.marginPercentage)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(data.current.profit, data.currency)}
          </p>
        </div>
      </div>
    )
  }
  if (variant === 'gauge') {
    const circumference = 2 * Math.PI * 40
    const strokeDasharray = circumference
    const maxMargin = data.target?.marginPercentage || 100
    const progress = (data.current.marginPercentage / maxMargin) * 100
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference
    return (
      <div className={cn('text-center space-y-3', sizeClasses.container, className)}>
        <h3 className={cn('font-medium', sizeClasses.title)}>{data.name}</h3>
        <div className="relative flex items-center justify-center">
          <svg className="h-32 w-32" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getMarginColor(marginLevel)}
              style={{
                strokeDasharray,
                strokeDashoffset,
                transform: 'rotate(-90deg)',
                transformOrigin: '50px 50px',
                transition: 'stroke-dashoffset 0.5s ease-in-out'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold text-2xl', getMarginColor(marginLevel))}>
              {formatPercentage(data.current.marginPercentage)}
            </span>
            <span className="text-xs text-muted-foreground">marge</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {formatCurrency(data.current.profit, data.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            Bénéfice {data.period.label}
          </p>
        </div>
        {showTarget && data.target && (
          <div className="text-xs text-muted-foreground">
            Objectif: {formatPercentage(data.target.marginPercentage)}
          </div>
        )}
      </div>
    )
  }
  if (variant === 'trend') {
    return (
      <div className={cn('space-y-3', sizeClasses.container, className)}>
        <div className="flex items-center justify-between">
          <h3 className={cn('font-medium', sizeClasses.title)}>{data.name}</h3>
          {trendData && (
            <div className="flex items-center gap-1">
              {trendData.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
              {trendData.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
              {trendData.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
              <span className={cn(
                'text-sm font-medium',
                trendData.direction === 'up' ? 'text-green-600' : 
                trendData.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {trendData.marginChange > 0 ? '+' : ''}{trendData.marginChange.toFixed(1)}pp
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Marge actuelle</p>
            <p className={cn('font-bold', sizeClasses.value, getMarginColor(marginLevel))}>
              {formatPercentage(data.current.marginPercentage)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bénéfice</p>
            <p className={cn('font-bold', sizeClasses.value)}>
              {formatCurrency(data.current.profit, data.currency)}
            </p>
          </div>
        </div>
        {showTarget && targetProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Objectif marge: {formatPercentage(data.target!.marginPercentage)}</span>
              <span className={targetProgress.marginAchieved ? 'text-green-600' : 'text-red-600'}>
                {targetProgress.marginProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  targetProgress.marginAchieved ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${targetProgress.marginProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
  // Detailed variant (default)
  return (
    <div className={cn('space-y-4', sizeClasses.container, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className={cn(sizeClasses.icon, 'text-green-600')} />
          </div>
          <div>
            <h3 className={cn('font-medium', sizeClasses.title)}>{data.name}</h3>
            <p className="text-xs text-muted-foreground">{data.period.label}</p>
          </div>
        </div>
        <Badge className={cn(
          'text-xs',
          marginLevel === 'excellent' ? 'bg-green-100 text-green-800 border-green-200' :
          marginLevel === 'good' ? 'bg-blue-100 text-blue-800 border-blue-200' :
          marginLevel === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          'bg-red-100 text-red-800 border-red-200'
        )}>
          {marginLevel === 'excellent' && 'Excellente'}
          {marginLevel === 'good' && 'Bonne'}
          {marginLevel === 'warning' && 'Attention'}
          {marginLevel === 'poor' && 'Faible'}
        </Badge>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          <p className="font-semibold">{formatCurrency(data.current.revenue, data.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Coûts</p>
          <p className="font-semibold text-red-600">{formatCurrency(data.current.cost, data.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Bénéfice</p>
          <p className="font-semibold text-green-600">{formatCurrency(data.current.profit, data.currency)}</p>
        </div>
      </div>
      {/* Margin Display */}
      <div className="text-center p-4 border rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground mb-1">Marge bénéficiaire</p>
        <p className={cn('font-bold text-3xl', getMarginColor(marginLevel))}>
          {formatPercentage(data.current.marginPercentage)}
        </p>
        {showTrend && trendData && (
          <div className="flex items-center justify-center gap-1 mt-2">
            {trendData.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trendData.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            {trendData.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
            <span className={cn(
              'text-sm font-medium',
              trendData.direction === 'up' ? 'text-green-600' : 
              trendData.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {trendData.marginChange > 0 ? '+' : ''}{trendData.marginChange.toFixed(1)} points
            </span>
          </div>
        )}
      </div>
      {/* Target Comparison */}
      {showTarget && data.target && targetProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Objectif: {formatPercentage(data.target.marginPercentage)}</span>
            <span className={cn(
              'font-medium',
              targetProgress.marginAchieved ? 'text-green-600' : 'text-red-600'
            )}>
              {targetProgress.marginAchieved ? 'Atteint' : 'Non atteint'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                targetProgress.marginAchieved ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${targetProgress.marginProgress}%` }}
            />
          </div>
        </div>
      )}
      {/* Cost Breakdown */}
      {showBreakdown && data.breakdown && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground font-medium">Répartition des coûts</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Matériaux</span>
              <span className="font-medium">{formatCurrency(data.breakdown.materialCosts, data.currency)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Main-d'œuvre</span>
              <span className="font-medium">{formatCurrency(data.breakdown.laborCosts, data.currency)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Frais généraux</span>
              <span className="font-medium">{formatCurrency(data.breakdown.overheadCosts, data.currency)}</span>
            </div>
            {data.breakdown.otherCosts > 0 && (
              <div className="flex justify-between text-xs">
                <span>Autres</span>
                <span className="font-medium">{formatCurrency(data.breakdown.otherCosts, data.currency)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Benchmark */}
      {showBenchmark && data.benchmark && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground font-medium">Références</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Industrie</span>
              <p className="font-medium">{formatPercentage(data.benchmark.industry)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Entreprise</span>
              <p className="font-medium">{formatPercentage(data.benchmark.company)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
