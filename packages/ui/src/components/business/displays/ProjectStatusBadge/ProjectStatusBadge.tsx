'use client'
import { Badge } from '../../../data-display/badge'
import { Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type ProjectStatus = 'draft' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'overdue'
interface ProjectStatusBadgeProps {
  status: ProjectStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function ProjectStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: ProjectStatusBadgeProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
      case 'planning':
        return {
          label: 'Planification',
          icon: Clock,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        }
      case 'in_progress':
        return {
          label: 'En cours',
          icon: Play,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'on_hold':
        return {
          label: 'En pause',
          icon: Pause,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'completed':
        return {
          label: 'Terminé',
          icon: CheckCircle,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        }
      case 'cancelled':
        return {
          label: 'Annulé',
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'overdue':
        return {
          label: 'En retard',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
        }
      default:
        return {
          label: 'Inconnu',
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
  const config = getStatusConfig(status)
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
