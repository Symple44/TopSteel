'use client'
import { Badge } from '../../../data-display/badge'
import { 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  X,
  Send
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partial'
interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  amount?: number
  totalAmount?: number
  currency?: string
  daysOverdue?: number
}
export function InvoiceStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className,
  amount,
  totalAmount,
  currency = 'EUR',
  daysOverdue = 0
}: InvoiceStatusBadgeProps) {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          icon: FileText,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        }
      case 'sent':
        return {
          label: 'Envoyée',
          icon: Send,
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        }
      case 'pending':
        return {
          label: 'En attente',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        }
      case 'paid':
        return {
          label: 'Payée',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        }
      case 'overdue':
        return {
          label: daysOverdue > 0 ? `En retard (${daysOverdue}j)` : 'En retard',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        }
      case 'cancelled':
        return {
          label: 'Annulée',
          icon: X,
          className: 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200',
        }
      case 'refunded':
        return {
          label: 'Remboursée',
          icon: ArrowRight,
          className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        }
      case 'partial':
        return {
          label: 'Paiement partiel',
          icon: Clock,
          className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
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
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
  const config = getStatusConfig(status)
  const Icon = config.icon
  // Calculate percentage for partial payments
  const getPartialPercentage = () => {
    if (status === 'partial' && amount && totalAmount) {
      return Math.round((amount / totalAmount) * 100)
    }
    return null
  }
  const partialPercentage = getPartialPercentage()
  return (
    <div className="flex flex-col gap-1">
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
      {/* Show partial payment details */}
      {status === 'partial' && amount && totalAmount && (
        <div className="text-xs text-muted-foreground">
          {formatCurrency(amount, currency)} / {formatCurrency(totalAmount, currency)}
          {partialPercentage && (
            <span className="ml-1">({partialPercentage}%)</span>
          )}
        </div>
      )}
      {/* Show overdue warning */}
      {status === 'overdue' && daysOverdue > 30 && (
        <div className="text-xs text-red-600 font-medium">
          Attention: Retard critique
        </div>
      )}
      {/* Show upcoming due date warning */}
      {status === 'pending' && daysOverdue < 0 && Math.abs(daysOverdue) <= 3 && (
        <div className="text-xs text-orange-600">
          Échéance dans {Math.abs(daysOverdue)} jour{Math.abs(daysOverdue) > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
