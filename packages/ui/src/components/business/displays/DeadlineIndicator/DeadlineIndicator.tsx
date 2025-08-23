'use client'
import { Badge } from '../../../data-display/badge'
import { AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type DeadlineStatus = 'overdue' | 'critical' | 'warning' | 'normal' | 'completed'
interface DeadlineIndicatorProps {
  deadline: Date
  status?: DeadlineStatus
  showIcon?: boolean
  showTimeRemaining?: boolean
  variant?: 'badge' | 'inline' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function DeadlineIndicator({
  deadline,
  status,
  showIcon = true,
  showTimeRemaining = true,
  variant = 'badge',
  size = 'md',
  className,
}: DeadlineIndicatorProps) {
  const now = new Date()
  const timeDiff = deadline.getTime() - now.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  const getAutoStatus = (): DeadlineStatus => {
    if (status) return status
    if (daysRemaining < 0) return 'overdue'
    if (daysRemaining === 0) return 'critical'
    if (daysRemaining <= 3) return 'warning'
    return 'normal'
  }
  const currentStatus = getAutoStatus()
  const getStatusConfig = (status: DeadlineStatus) => {
    switch (status) {
      case 'overdue':
        return {
          label: 'En retard',
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'critical':
        return {
          label: 'Critique',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'warning':
        return {
          label: 'Urgent',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'normal':
        return {
          label: 'À temps',
          icon: Calendar,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        }
      case 'completed':
        return {
          label: 'Terminé',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      default:
        return {
          label: 'Inconnu',
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
    }
  }
  const formatTimeRemaining = (days: number) => {
    if (days < 0) {
      const overdueDays = Math.abs(days)
      return `En retard de ${overdueDays} jour${overdueDays > 1 ? 's' : ''}`
    }
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Demain'
    return `Dans ${days} jours`
  }
  const formatDeadline = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-sm px-3 py-1.5'
      default:
        return 'text-xs px-2.5 py-1'
    }
  }
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3'
      case 'lg':
        return 'h-4 w-4'
      default:
        return 'h-3.5 w-3.5'
    }
  }
  const config = getStatusConfig(currentStatus)
  const Icon = config.icon
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
        {showIcon && <Icon className={cn(getIconSize(), getStatusConfig(currentStatus).className.split(' ')[1])} />}
        {showTimeRemaining ? formatTimeRemaining(daysRemaining) : formatDeadline(deadline)}
      </span>
    )
  }
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2">
          <Badge className={cn(config.className, getSizeClasses())}>
            {showIcon && <Icon className={getIconSize()} />}
            {config.label}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <div>Échéance: {formatDeadline(deadline)}</div>
          {showTimeRemaining && (
            <div className={cn(
              currentStatus === 'overdue' ? 'text-red-600' :
              currentStatus === 'critical' ? 'text-red-600' :
              currentStatus === 'warning' ? 'text-yellow-600' :
              'text-muted-foreground'
            )}>
              {formatTimeRemaining(daysRemaining)}
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <Badge 
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        getSizeClasses(),
        className
      )}
      title={`Échéance: ${formatDeadline(deadline)}`}
    >
      {showIcon && <Icon className={getIconSize()} />}
      {showTimeRemaining ? formatTimeRemaining(daysRemaining) : config.label}
    </Badge>
  )
}
