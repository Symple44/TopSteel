'use client'
import { CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
interface CompletionIndicatorProps {
  percentage: number
  showPercentage?: boolean
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'circular' | 'linear' | 'steps'
  steps?: number
  className?: string
}
export function CompletionIndicator({
  percentage,
  showPercentage = true,
  showLabel = false,
  label,
  size = 'md',
  variant = 'circular',
  steps,
  className,
}: CompletionIndicatorProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage))
  const getColorClass = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    if (percentage >= 25) return 'text-orange-600'
    return 'text-red-600'
  }
  const getBackgroundColorClass = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600'
    if (percentage >= 75) return 'bg-blue-600'
    if (percentage >= 50) return 'bg-yellow-600'
    if (percentage >= 25) return 'bg-orange-600'
    return 'bg-red-600'
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-12 h-12',
          text: 'text-xs',
          stroke: '4',
        }
      case 'lg':
        return {
          container: 'w-20 h-20',
          text: 'text-base',
          stroke: '6',
        }
      default:
        return {
          container: 'w-16 h-16',
          text: 'text-sm',
          stroke: '5',
        }
    }
  }
  const sizeConfig = getSizeClasses()
  if (variant === 'circular') {
    const radius = 50 - parseInt(sizeConfig.stroke) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn('relative', sizeConfig.container)}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth={sizeConfig.stroke}
              fill="none"
              className="text-muted-foreground/20"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth={sizeConfig.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn('transition-all duration-500 ease-in-out', getColorClass(clampedPercentage))}
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('font-semibold', sizeConfig.text, getColorClass(clampedPercentage))}>
                {Math.round(clampedPercentage)}%
              </span>
            </div>
          )}
        </div>
        {showLabel && label && (
          <span className="text-sm text-muted-foreground text-center">{label}</span>
        )}
      </div>
    )
  }
  if (variant === 'linear') {
    return (
      <div className={cn('w-full space-y-2', className)}>
        {showLabel && label && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{label}</span>
            {showPercentage && (
              <span className={cn('text-sm font-semibold', getColorClass(clampedPercentage))}>
                {Math.round(clampedPercentage)}%
              </span>
            )}
          </div>
        )}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500 ease-in-out',
              getBackgroundColorClass(clampedPercentage)
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
      </div>
    )
  }
  if (variant === 'steps' && steps) {
    const completedSteps = Math.floor((clampedPercentage / 100) * steps)
    return (
      <div className={cn('space-y-2', className)}>
        {showLabel && label && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{steps} étapes
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {Array.from({ length: steps }, (_, index) => {
            const isCompleted = index < completedSteps
            const isCurrent = index === completedSteps && clampedPercentage < 100
            return (
              <div key={index} className="flex items-center">
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : isCurrent ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                {index < steps - 1 && (
                  <div className={cn(
                    'w-4 h-0.5 mx-1',
                    isCompleted ? 'bg-green-600' : 'bg-muted-foreground/20'
                  )} />
                )}
              </div>
            )
          })}
        </div>
        {showPercentage && (
          <div className="text-right">
            <span className={cn('text-xs font-semibold', getColorClass(clampedPercentage))}>
              {Math.round(clampedPercentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
  return null
}
