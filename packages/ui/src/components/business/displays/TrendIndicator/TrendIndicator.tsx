'use client'
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type TrendDirection = 'up' | 'down' | 'neutral'
interface TrendIndicatorProps {
  value: number
  previousValue?: number
  percentage?: number
  direction?: TrendDirection
  showValue?: boolean
  showPercentage?: boolean
  showIcon?: boolean
  variant?: 'simple' | 'detailed' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function TrendIndicator({
  value,
  previousValue,
  percentage,
  direction,
  showValue = true,
  showPercentage = true,
  showIcon = true,
  variant = 'simple',
  size = 'md',
  className,
}: TrendIndicatorProps) {
  // Calculate trend if not provided
  const calculatedPercentage =
    percentage ||
    (previousValue && previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : 0)
  const calculatedDirection =
    direction || (calculatedPercentage > 0 ? 'up' : calculatedPercentage < 0 ? 'down' : 'neutral')
  const getTrendConfig = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: variant === 'minimal' ? ArrowUp : TrendingUp,
          label: 'Hausse',
        }
      case 'down':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: variant === 'minimal' ? ArrowDown : TrendingDown,
          label: 'Baisse',
        }
      case 'neutral':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: Minus,
          label: 'Stable',
        }
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: Minus,
          label: 'Aucune donnée',
        }
    }
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'h-3 w-3',
          text: 'text-xs',
          container: 'gap-1',
        }
      case 'lg':
        return {
          icon: 'h-5 w-5',
          text: 'text-base',
          container: 'gap-2',
        }
      default:
        return {
          icon: 'h-4 w-4',
          text: 'text-sm',
          container: 'gap-1.5',
        }
    }
  }
  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    }
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}k`
    }
    return val.toLocaleString('fr-FR')
  }
  const formatPercentage = (pct: number) => {
    const absPercentage = Math.abs(pct)
    const sign = pct > 0 ? '+' : pct < 0 ? '-' : ''
    return `${sign}${absPercentage.toFixed(1)}%`
  }
  const config = getTrendConfig(calculatedDirection)
  const sizeConfig = getSizeClasses()
  const Icon = config.icon
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'inline-flex items-center',
          sizeConfig.container,
          config.color,
          sizeConfig.text,
          className
        )}
      >
        {showIcon && <Icon className={sizeConfig.icon} />}
        {showPercentage && (
          <span className="font-medium">{formatPercentage(calculatedPercentage)}</span>
        )}
      </div>
    )
  }
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-md px-2 py-1',
          config.bgColor,
          sizeConfig.container,
          className
        )}
      >
        {showIcon && <Icon className={cn(sizeConfig.icon, config.color)} />}
        <div className={cn('flex flex-col', sizeConfig.text)}>
          {showValue && <span className="font-semibold">{formatValue(value)}</span>}
          {showPercentage && (
            <span className={cn('font-medium', config.color)}>
              {formatPercentage(calculatedPercentage)}
            </span>
          )}
        </div>
        {previousValue && (
          <span className={cn('text-muted-foreground ml-2', sizeConfig.text)}>
            (vs {formatValue(previousValue)})
          </span>
        )}
      </div>
    )
  }
  // Simple variant (default)
  return (
    <div className={cn('inline-flex items-center', sizeConfig.container, className)}>
      {showIcon && (
        <div className={cn('rounded-full p-1', config.bgColor)}>
          <Icon className={cn(sizeConfig.icon, config.color)} />
        </div>
      )}
      <div className={cn('flex items-center gap-1', sizeConfig.text)}>
        {showValue && <span className="font-semibold">{formatValue(value)}</span>}
        {showPercentage && (
          <span className={cn('font-medium', config.color)}>
            {formatPercentage(calculatedPercentage)}
          </span>
        )}
      </div>
    </div>
  )
}
