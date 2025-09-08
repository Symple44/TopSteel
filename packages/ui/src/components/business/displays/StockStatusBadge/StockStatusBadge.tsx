'use client'
import { AlertTriangle, CheckCircle, Clock, Package, XCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'on_order'
  | 'discontinued'
  | 'reserved'
interface StockStatusBadgeProps {
  status: StockStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function StockStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: StockStatusBadgeProps) {
  const getStatusConfig = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return {
          label: 'En stock',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'low_stock':
        return {
          label: 'Stock faible',
          icon: AlertTriangle,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'out_of_stock':
        return {
          label: 'Rupture',
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'on_order':
        return {
          label: 'En commande',
          icon: Clock,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        }
      case 'discontinued':
        return {
          label: 'Arrêté',
          icon: XCircle,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
      case 'reserved':
        return {
          label: 'Réservé',
          icon: Package,
          className: 'bg-purple-100 text-purple-800 border-purple-200',
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
