'use client'
import { AlertTriangle, CheckCircle, Clock, Pause, XCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
export type ClientStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'new'
  | 'vip'
  | 'blacklisted'
interface ClientStatusBadgeProps {
  status: ClientStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function ClientStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: ClientStatusBadgeProps) {
  const getStatusConfig = (status: ClientStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Actif',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        }
      case 'inactive':
        return {
          label: 'Inactif',
          icon: Pause,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        }
      case 'pending':
        return {
          label: 'En attente',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        }
      case 'suspended':
        return {
          label: 'Suspendu',
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        }
      case 'new':
        return {
          label: 'Nouveau',
          icon: AlertTriangle,
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        }
      case 'vip':
        return {
          label: 'VIP',
          icon: CheckCircle,
          className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        }
      case 'blacklisted':
        return {
          label: 'Liste noire',
          icon: XCircle,
          className: 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200',
        }
      default:
        return {
          label: 'Inconnu',
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
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
        'inline-flex items-center gap-1.5 font-medium transition-colors',
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
