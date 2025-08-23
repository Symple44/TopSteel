'use client'
import { Clock, AlertTriangle, Calendar, Package, Factory, Truck } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type DeadlineUrgency = 'low' | 'medium' | 'high' | 'critical' | 'overdue'
export type DeadlineType = 'production' | 'delivery' | 'payment' | 'inspection' | 'maintenance' | 'order_confirmation'
export interface DeadlineItem {
  id: string
  title: string
  type: DeadlineType
  deadline: string
  description?: string
  associatedItems?: string[]
  impact?: string
  actionRequired?: string
}
export interface DeadlineAlertProps {
  className?: string
  urgency: DeadlineUrgency
  deadlines: DeadlineItem[]
  onDismiss?: (deadlineId: string) => void
  onTakeAction?: (deadlineId: string) => void
  onSnooze?: (deadlineId: string, duration: number) => void // duration in hours
  showActions?: boolean
}
const urgencyConfig = {
  low: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    title: 'Échéance à venir'
  },
  medium: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    title: 'Échéance proche'
  },
  high: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    title: 'Échéance imminente'
  },
  critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    title: 'Échéance critique'
  },
  overdue: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
    title: 'Échéance dépassée'
  }
}
const typeConfig = {
  production: {
    icon: Factory,
    label: 'Production',
    color: 'text-orange-600'
  },
  delivery: {
    icon: Truck,
    label: 'Livraison',
    color: 'text-blue-600'
  },
  payment: {
    icon: Calendar,
    label: 'Paiement',
    color: 'text-green-600'
  },
  inspection: {
    icon: Package,
    label: 'Inspection',
    color: 'text-purple-600'
  },
  maintenance: {
    icon: AlertTriangle,
    label: 'Maintenance',
    color: 'text-yellow-600'
  },
  order_confirmation: {
    icon: Package,
    label: 'Confirmation commande',
    color: 'text-indigo-600'
  }
}
export function DeadlineAlert({ 
  className, 
  urgency, 
  deadlines, 
  onDismiss, 
  onTakeAction, 
  onSnooze,
  showActions = true 
}: DeadlineAlertProps) {
  const config = urgencyConfig[urgency]
  const formatDeadline = (deadlineString: string) => {
    const deadline = new Date(deadlineString)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays)
      if (overdueDays === 0) {
        const overdueHours = Math.abs(diffHours)
        return `En retard de ${overdueHours}h`
      }
      return `En retard de ${overdueDays}j`
    }
    if (diffDays === 0) {
      if (diffHours <= 1) return 'Dans moins d\'1h'
      return `Dans ${diffHours}h`
    }
    if (diffDays === 1) return 'Demain'
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    return deadline.toLocaleDateString('fr-FR')
  }
  const getRelativeTimeColor = (deadlineString: string) => {
    const deadline = new Date(deadlineString)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs < 0) return 'text-red-600 font-medium'
    if (diffMs < 24 * 60 * 60 * 1000) return 'text-orange-600 font-medium'
    if (diffMs < 7 * 24 * 60 * 60 * 1000) return 'text-yellow-600 font-medium'
    return 'text-blue-600'
  }
  const handleSnooze = (deadlineId: string, duration: number) => {
    onSnooze?.(deadlineId, duration)
  }
  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <Clock className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={cn('font-medium', config.textColor)}>
              {config.title}
            </h3>
            <p className={cn('text-sm mt-1', config.textColor)}>
              {deadlines.length} échéance{deadlines.length > 1 ? 's' : ''} nécessite{deadlines.length === 1 ? '' : 'nt'} votre attention
            </p>
          </div>
          <div className="space-y-3">
            {deadlines.map((deadline) => {
              const TypeIcon = typeConfig[deadline.type].icon
              return (
                <div key={deadline.id} className="bg-white/50 rounded-lg p-3 border border-white/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <TypeIcon className={cn('h-4 w-4 mt-0.5', typeConfig[deadline.type].color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{deadline.title}</h4>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full bg-gray-100', typeConfig[deadline.type].color)}>
                            {typeConfig[deadline.type].label}
                          </span>
                        </div>
                        <p className={cn('text-sm', getRelativeTimeColor(deadline.deadline))}>
                          {formatDeadline(deadline.deadline)}
                        </p>
                        {deadline.description && (
                          <p className="text-xs text-gray-600 mt-1">{deadline.description}</p>
                        )}
                        {deadline.associatedItems && deadline.associatedItems.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Éléments associés: </span>
                            <span className="text-xs text-gray-700">
                              {deadline.associatedItems.slice(0, 2).join(', ')}
                              {deadline.associatedItems.length > 2 && ` +${deadline.associatedItems.length - 2} autres`}
                            </span>
                          </div>
                        )}
                        {deadline.impact && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>Impact:</strong> {deadline.impact}
                          </div>
                        )}
                        {deadline.actionRequired && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            <strong>Action requise:</strong> {deadline.actionRequired}
                          </div>
                        )}
                      </div>
                    </div>
                    {showActions && (
                      <div className="flex flex-col gap-1">
                        {onTakeAction && (
                          <button
                            onClick={() => onTakeAction(deadline.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Action
                          </button>
                        )}
                        {onSnooze && urgency !== 'overdue' && (
                          <div className="relative group">
                            <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                              Reporter
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => handleSnooze(deadline.id, 1)}
                                className="block w-full text-xs px-2 py-1 text-left hover:bg-gray-100 whitespace-nowrap"
                              >
                                1h
                              </button>
                              <button
                                onClick={() => handleSnooze(deadline.id, 4)}
                                className="block w-full text-xs px-2 py-1 text-left hover:bg-gray-100 whitespace-nowrap"
                              >
                                4h
                              </button>
                              <button
                                onClick={() => handleSnooze(deadline.id, 24)}
                                className="block w-full text-xs px-2 py-1 text-left hover:bg-gray-100 whitespace-nowrap"
                              >
                                1j
                              </button>
                            </div>
                          </div>
                        )}
                        {onDismiss && (
                          <button
                            onClick={() => onDismiss(deadline.id)}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
