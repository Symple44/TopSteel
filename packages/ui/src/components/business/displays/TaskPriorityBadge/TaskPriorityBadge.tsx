'use client'
import { Badge } from '../../../data-display/badge'
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'none'
interface TaskPriorityBadgeProps {
  priority: TaskPriority
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function TaskPriorityBadge({ 
  priority, 
  showIcon = true, 
  size = 'md',
  className 
}: TaskPriorityBadgeProps) {
  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return {
          label: 'Critique',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
        }
      case 'high':
        return {
          label: 'Haute',
          icon: ArrowUp,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
        }
      case 'medium':
        return {
          label: 'Moyenne',
          icon: Minus,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'low':
        return {
          label: 'Faible',
          icon: ArrowDown,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'none':
        return {
          label: 'Aucune',
          icon: Minus,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
      default:
        return {
          label: 'Inconnue',
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
    }
  }
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-sm px-3 py-1.5'
      default:
        return 'text-xs px-2.5 py-1'
    }
  }
  const getIconSize = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3'
      case 'lg':
        return 'h-4 w-4'
      default:
        return 'h-3.5 w-3.5'
    }
  }
  const config = getPriorityConfig(priority)
  const Icon = config.icon
  return (
    <Badge 
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        getSizeClasses(size),
        className
      )}
    >
      {showIcon && <Icon className={getIconSize(size)} />}
      {config.label}
    </Badge>
  )
}
