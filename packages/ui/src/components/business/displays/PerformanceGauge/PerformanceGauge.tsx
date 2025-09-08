'use client'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  target?: number
  previousValue?: number
  unit: string
  format?: 'number' | 'percentage' | 'currency' | 'weight'
  precision?: number
  category: 'production' | 'quality' | 'efficiency' | 'safety' | 'financial'
  threshold?: {
    excellent: number
    good: number
    warning: number
  }
}
interface PerformanceGaugeProps {
  metric: PerformanceMetric
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTrend?: boolean
  showTarget?: boolean
  showLabel?: boolean
  variant?: 'circular' | 'linear' | 'minimal'
  className?: string
  loading?: boolean
}
export function PerformanceGauge({
  metric,
  size = 'md',
  showTrend = true,
  showTarget = true,
  showLabel = true,
  variant = 'circular',
  className,
  loading = false,
}: PerformanceGaugeProps) {
  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded-full" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    )
  }
  const formatValue = (value: number, format?: string, precision: number = 1) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(precision)}%`
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value)
      case 'weight':
        return `${value.toFixed(precision)} ${metric.unit}`
      default:
        return `${value.toFixed(precision)} ${metric.unit}`
    }
  }
  const getPerformanceLevel = () => {
    if (!metric.threshold) return 'neutral'
    const { excellent, good, warning } = metric.threshold
    if (metric.value >= excellent) return 'excellent'
    if (metric.value >= good) return 'good'
    if (metric.value >= warning) return 'warning'
    return 'poor'
  }
  const getTargetProgress = () => {
    if (!metric.target) return 0
    return Math.min((metric.value / metric.target) * 100, 100)
  }
  const getTrendDirection = () => {
    if (!metric.previousValue) return 'neutral'
    if (metric.value > metric.previousValue) return 'up'
    if (metric.value < metric.previousValue) return 'down'
    return 'neutral'
  }
  const getTrendPercentage = () => {
    if (!metric.previousValue || metric.previousValue === 0) return 0
    return ((metric.value - metric.previousValue) / metric.previousValue) * 100
  }
  const getPerformanceColor = (level: string) => {
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
  const getProgressBarColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-500'
      case 'good':
        return 'bg-blue-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }
  const getCategoryIcon = () => {
    switch (metric.category) {
      case 'production':
        return Activity
      case 'quality':
        return CheckCircle
      case 'efficiency':
        return Target
      case 'safety':
        return AlertTriangle
      case 'financial':
        return TrendingUp
      default:
        return Activity
    }
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          gauge: 'h-16 w-16',
          text: 'text-lg',
          label: 'text-xs',
          icon: 'h-3 w-3',
        }
      case 'lg':
        return {
          container: 'p-6',
          gauge: 'h-32 w-32',
          text: 'text-3xl',
          label: 'text-sm',
          icon: 'h-5 w-5',
        }
      case 'xl':
        return {
          container: 'p-8',
          gauge: 'h-40 w-40',
          text: 'text-4xl',
          label: 'text-base',
          icon: 'h-6 w-6',
        }
      default:
        return {
          container: 'p-4',
          gauge: 'h-24 w-24',
          text: 'text-2xl',
          label: 'text-sm',
          icon: 'h-4 w-4',
        }
    }
  }
  const performanceLevel = getPerformanceLevel()
  const targetProgress = getTargetProgress()
  const trendDirection = getTrendDirection()
  const trendPercentage = getTrendPercentage()
  const CategoryIcon = getCategoryIcon()
  const sizeClasses = getSizeClasses()
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn('p-2 rounded-lg bg-gray-100', getPerformanceColor(performanceLevel))}>
          <CategoryIcon className={sizeClasses.icon} />
        </div>
        <div className="flex-1">
          {showLabel && <p className={cn('font-medium', sizeClasses.label)}>{metric.name}</p>}
          <p className={cn('font-bold', sizeClasses.text, getPerformanceColor(performanceLevel))}>
            {formatValue(metric.value, metric.format, metric.precision)}
          </p>
        </div>
        {showTrend && metric.previousValue && (
          <div className="flex items-center gap-1">
            {trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            {trendDirection === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
            <span
              className={cn(
                'text-sm font-medium',
                trendDirection === 'up'
                  ? 'text-green-600'
                  : trendDirection === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}
            >
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    )
  }
  if (variant === 'linear') {
    return (
      <div className={cn('space-y-3', sizeClasses.container, className)}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className={sizeClasses.icon} />
              <span className={cn('font-medium', sizeClasses.label)}>{metric.name}</span>
            </div>
            {showTrend && metric.previousValue && (
              <div className="flex items-center gap-1">
                {trendDirection === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                {trendDirection === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                {trendDirection === 'neutral' && <Minus className="h-3 w-3 text-gray-600" />}
                <span
                  className={cn(
                    'text-xs',
                    trendDirection === 'up'
                      ? 'text-green-600'
                      : trendDirection === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  )}
                >
                  {Math.abs(trendPercentage).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className={cn('font-bold', sizeClasses.text, getPerformanceColor(performanceLevel))}
            >
              {formatValue(metric.value, metric.format, metric.precision)}
            </span>
            {showTarget && metric.target && (
              <span className="text-sm text-muted-foreground">
                Objectif: {formatValue(metric.target, metric.format, metric.precision)}
              </span>
            )}
          </div>
          {metric.target && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getProgressBarColor(performanceLevel)
                )}
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          )}
        </div>
        <Badge
          className={cn(
            'text-xs',
            performanceLevel === 'excellent'
              ? 'bg-green-100 text-green-800 border-green-200'
              : performanceLevel === 'good'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : performanceLevel === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
          )}
        >
          {performanceLevel === 'excellent' && 'Excellent'}
          {performanceLevel === 'good' && 'Bon'}
          {performanceLevel === 'warning' && 'Attention'}
          {performanceLevel === 'poor' && 'Critique'}
        </Badge>
      </div>
    )
  }
  // Circular variant (default)
  const circumference = 2 * Math.PI * 40
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (targetProgress / 100) * circumference
  return (
    <div className={cn('text-center space-y-3', sizeClasses.container, className)}>
      {showLabel && (
        <div className="flex items-center justify-center gap-2">
          <CategoryIcon className={sizeClasses.icon} />
          <span className={cn('font-medium', sizeClasses.label)}>{metric.name}</span>
        </div>
      )}
      <div className="relative flex items-center justify-center">
        <svg
          className={sizeClasses.gauge}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Jauge de performance pour ${metric.name}: ${formatValue(metric.value, metric.format, metric.precision)}`}
        >
          <title>Jauge de performance circulaire</title>
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          {/* Progress circle */}
          {metric.target && (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getPerformanceColor(performanceLevel)}
              style={{
                strokeDasharray,
                strokeDashoffset,
                transform: 'rotate(-90deg)',
                transformOrigin: '50px 50px',
                transition: 'stroke-dashoffset 0.5s ease-in-out',
              }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn('font-bold', sizeClasses.text, getPerformanceColor(performanceLevel))}
          >
            {formatValue(metric.value, metric.format, metric.precision)}
          </span>
          {showTarget && metric.target && (
            <span className="text-xs text-muted-foreground">
              /{formatValue(metric.target, metric.format, metric.precision)}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {showTrend && metric.previousValue && (
          <div className="flex items-center justify-center gap-1">
            {trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            {trendDirection === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
            <span
              className={cn(
                'text-sm font-medium',
                trendDirection === 'up'
                  ? 'text-green-600'
                  : trendDirection === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}
            >
              {trendPercentage > 0 ? '+' : ''}
              {trendPercentage.toFixed(1)}%
            </span>
          </div>
        )}
        <Badge
          className={cn(
            'text-xs',
            performanceLevel === 'excellent'
              ? 'bg-green-100 text-green-800 border-green-200'
              : performanceLevel === 'good'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : performanceLevel === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
          )}
        >
          {performanceLevel === 'excellent' && 'Excellent'}
          {performanceLevel === 'good' && 'Bon'}
          {performanceLevel === 'warning' && 'Attention'}
          {performanceLevel === 'poor' && 'Critique'}
        </Badge>
      </div>
    </div>
  )
}
