'use client'
import { AlertTriangle, Award, CheckCircle, Target, XCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
export type QualityLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical'
export type QualityMetric =
  | 'defect_rate'
  | 'compliance'
  | 'certification'
  | 'customer_satisfaction'
  | 'performance'
interface QualityIndicatorProps {
  level: QualityLevel
  metric?: QualityMetric
  value?: number
  target?: number
  unit?: string
  label?: string
  showIcon?: boolean
  showValue?: boolean
  variant?: 'badge' | 'detailed' | 'gauge'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function QualityIndicator({
  level,
  metric,
  value,
  target,
  unit,
  label,
  showIcon = true,
  showValue = true,
  variant = 'badge',
  size = 'md',
  className,
}: QualityIndicatorProps) {
  const getQualityConfig = (level: QualityLevel) => {
    switch (level) {
      case 'excellent':
        return {
          label: 'Excellent',
          icon: Award,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          score: 95,
        }
      case 'good':
        return {
          label: 'Bon',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          score: 80,
        }
      case 'average':
        return {
          label: 'Moyen',
          icon: Target,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          score: 65,
        }
      case 'poor':
        return {
          label: 'Faible',
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          score: 40,
        }
      case 'critical':
        return {
          label: 'Critique',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          score: 20,
        }
      default:
        return {
          label: 'Inconnu',
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
          score: 0,
        }
    }
  }
  const getMetricLabel = (metric: QualityMetric) => {
    switch (metric) {
      case 'defect_rate':
        return 'Taux de défauts'
      case 'compliance':
        return 'Conformité'
      case 'certification':
        return 'Certification'
      case 'customer_satisfaction':
        return 'Satisfaction client'
      case 'performance':
        return 'Performance'
      default:
        return 'Qualité'
    }
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          gauge: 'w-12 h-12',
          icon: 'h-3 w-3',
          text: 'text-xs',
          badge: 'text-xs px-2 py-1',
        }
      case 'lg':
        return {
          gauge: 'w-20 h-20',
          icon: 'h-5 w-5',
          text: 'text-base',
          badge: 'text-sm px-3 py-1.5',
        }
      default:
        return {
          gauge: 'w-16 h-16',
          icon: 'h-4 w-4',
          text: 'text-sm',
          badge: 'text-xs px-2.5 py-1',
        }
    }
  }
  const config = getQualityConfig(level)
  const sizeConfig = getSizeClasses()
  const Icon = config.icon
  const displayLabel = label || (metric ? getMetricLabel(metric) : config.label)
  const formatValue = (val: number) => {
    if (unit === '%') return `${val.toFixed(1)}%`
    if (unit === 'ppm') return `${val} ppm`
    return `${val}${unit || ''}`
  }
  if (variant === 'badge') {
    return (
      <Badge
        className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          config.badgeColor,
          sizeConfig.badge,
          className
        )}
      >
        {showIcon && <Icon className={sizeConfig.icon} />}
        {displayLabel}
        {showValue && value !== undefined && <span className="ml-1">({formatValue(value)})</span>}
      </Badge>
    )
  }
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3 p-3 border rounded-lg', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn(sizeConfig.icon, config.color)} />
            <span className="font-medium">{displayLabel}</span>
          </div>
          <Badge className={config.badgeColor}>{config.label}</Badge>
        </div>
        {value !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valeur actuelle:</span>
              <span className="font-medium">{formatValue(value)}</span>
            </div>
            {target !== undefined && (
              <div className="flex justify-between text-sm">
                <span>Objectif:</span>
                <span>{formatValue(target)}</span>
              </div>
            )}
            {target !== undefined && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    value >= target ? 'bg-green-500' : 'bg-orange-500'
                  )}
                  style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Score qualité: {config.score}/100</div>
      </div>
    )
  }
  if (variant === 'gauge') {
    const percentage = config.score
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn('relative', sizeConfig.gauge)}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted-foreground/20"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn('transition-all duration-500 ease-in-out', config.color)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showIcon && <Icon className={cn(sizeConfig.icon, config.color)} />}
            <span className={cn('font-bold', sizeConfig.text)}>{config.score}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className={cn('font-medium', config.color, sizeConfig.text)}>{config.label}</div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>
    )
  }
  return null
}
