'use client'
import { AlertTriangle, Package, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '../../../data-display/badge'
import { cn } from '../../../../lib/utils'
export type StockStatus = 'critical' | 'low' | 'normal' | 'high' | 'overstock'
interface StockLevelIndicatorProps {
  current: number
  minimum: number
  maximum: number
  unit: string
  reorderPoint?: number
  showLabel?: boolean
  showValues?: boolean
  variant?: 'gauge' | 'bar' | 'badge' | 'compact' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function StockLevelIndicator({
  current,
  minimum,
  maximum,
  unit,
  reorderPoint,
  showLabel = true,
  showValues = true,
  variant = 'gauge',
  size = 'md',
  className,
}: StockLevelIndicatorProps) {
  const getStockStatus = (): StockStatus => {
    const reorder = reorderPoint || minimum * 1.2
    if (current <= 0) return 'critical'
    if (current <= minimum) return 'critical'
    if (current <= reorder) return 'low'
    if (current >= maximum) return 'overstock'
    if (current >= maximum * 0.8) return 'high'
    return 'normal'
  }
  const getStatusConfig = (status: StockStatus) => {
    switch (status) {
      case 'critical':
        return {
          label: 'Critique',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          barColor: 'bg-red-500',
        }
      case 'low':
        return {
          label: 'Faible',
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          barColor: 'bg-yellow-500',
        }
      case 'normal':
        return {
          label: 'Normal',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          barColor: 'bg-green-500',
        }
      case 'high':
        return {
          label: 'Élevé',
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          barColor: 'bg-blue-500',
        }
      case 'overstock':
        return {
          label: 'Surplus',
          icon: AlertTriangle,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          barColor: 'bg-purple-500',
        }
      default:
        return {
          label: 'Inconnu',
          icon: Package,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
          barColor: 'bg-gray-500',
        }
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
  const status = getStockStatus()
  const config = getStatusConfig(status)
  const sizeConfig = getSizeClasses()
  const percentage = Math.min((current / maximum) * 100, 100)
  const Icon = config.icon
  const formatValue = (value: number) => {
    return value.toLocaleString('fr-FR')
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
        <Icon className={sizeConfig.icon} />
        {showLabel && config.label}
        {showValues && ` (${formatValue(current)} ${unit})`}
      </Badge>
    )
  }
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('p-1 rounded-full', config.bgColor)}>
          <Icon className={cn(sizeConfig.icon, config.color)} />
        </div>
        <div className={sizeConfig.text}>
          {showValues && (
            <div className="font-medium">
              {formatValue(current)} {unit}
            </div>
          )}
          {showLabel && (
            <div className={cn('text-xs', config.color)}>
              {config.label}
            </div>
          )}
        </div>
      </div>
    )
  }
  if (variant === 'bar') {
    return (
      <div className={cn('space-y-2', className)}>
        {showLabel && (
          <div className="flex justify-between items-center">
            <span className={cn('font-medium', sizeConfig.text)}>
              Niveau de stock
            </span>
            <span className={cn('font-medium', config.color, sizeConfig.text)}>
              {config.label}
            </span>
          </div>
        )}
        <div className="relative">
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={cn('h-3 rounded-full transition-all duration-300', config.barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Minimum line */}
          <div 
            className="absolute top-0 h-3 w-0.5 bg-gray-400"
            style={{ left: `${(minimum / maximum) * 100}%` }}
          />
          {/* Reorder point line */}
          {reorderPoint && (
            <div 
              className="absolute top-0 h-3 w-0.5 bg-yellow-500"
              style={{ left: `${(reorderPoint / maximum) * 100}%` }}
            />
          )}
        </div>
        {showValues && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatValue(current)} {unit}</span>
            <span>Max: {formatValue(maximum)} {unit}</span>
          </div>
        )}
      </div>
    )
  }
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3 p-3 border rounded-lg', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn(sizeConfig.icon, config.color)} />
            <span className="font-medium">Stock actuel</span>
          </div>
          <Badge className={config.badgeColor}>
            {config.label}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Quantité actuelle:</span>
            <span className="font-medium">{formatValue(current)} {unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Stock minimum:</span>
            <span>{formatValue(minimum)} {unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Stock maximum:</span>
            <span>{formatValue(maximum)} {unit}</span>
          </div>
          {reorderPoint && (
            <div className="flex justify-between text-sm">
              <span>Point de commande:</span>
              <span>{formatValue(reorderPoint)} {unit}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all duration-300', config.barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Remplissage: {percentage.toFixed(1)}% de la capacité maximale
        </div>
      </div>
    )
  }
  // Gauge variant (default)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', sizeConfig.gauge)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
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
          <Icon className={cn(sizeConfig.icon, config.color)} />
          {showValues && (
            <span className={cn('font-bold', sizeConfig.text)}>
              {formatValue(current)}
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <div className={cn('font-medium', config.color, sizeConfig.text)}>
            {config.label}
          </div>
          {showValues && (
            <div className="text-xs text-muted-foreground">
              {unit} • {percentage.toFixed(0)}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}
