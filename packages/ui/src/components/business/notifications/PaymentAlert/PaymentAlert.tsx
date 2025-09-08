'use client'
import { AlertTriangle, Building, Calendar, CreditCard, Euro } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type PaymentUrgency = 'upcoming' | 'due_today' | 'overdue' | 'critical'
export type PaymentType = 'invoice' | 'supplier_payment' | 'subscription' | 'loan' | 'tax_payment'
export interface PaymentItem {
  id: string
  type: PaymentType
  description: string
  amount: number
  currency: string
  dueDate: string
  creditor: string
  invoiceNumber?: string
  overdueDays?: number
  lateFee?: number
  paymentMethod?: string
  canPayNow?: boolean
}
export interface PaymentAlertProps {
  className?: string
  urgency: PaymentUrgency
  payments: PaymentItem[]
  totalAmount: number
  currency: string
  onPayNow?: (paymentId: string) => void
  onSchedulePayment?: (paymentId: string) => void
  onRequestExtension?: (paymentId: string) => void
  onViewDetails?: (paymentId: string) => void
  showActions?: boolean
}
const urgencyConfig = {
  upcoming: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    title: 'Paiements à venir',
  },
  due_today: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    title: "Paiements dus aujourd'hui",
  },
  overdue: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    title: 'Paiements en retard',
  },
  critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    title: 'Paiements critiques',
  },
}
const typeConfig = {
  invoice: {
    icon: CreditCard,
    label: 'Facture client',
    color: 'text-blue-600',
  },
  supplier_payment: {
    icon: Building,
    label: 'Paiement fournisseur',
    color: 'text-green-600',
  },
  subscription: {
    icon: Calendar,
    label: 'Abonnement',
    color: 'text-purple-600',
  },
  loan: {
    icon: Euro,
    label: 'Prêt',
    color: 'text-orange-600',
  },
  tax_payment: {
    icon: AlertTriangle,
    label: 'Impôt',
    color: 'text-red-600',
  },
}
export function PaymentAlert({
  className,
  urgency,
  payments,
  totalAmount,
  currency,
  onPayNow,
  onSchedulePayment,
  onRequestExtension,
  onViewDetails,
  showActions = true,
}: PaymentAlertProps) {
  const config = urgencyConfig[urgency]
  const formatCurrency = (amount: number, curr = currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: curr,
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Demain'
    if (diffDays === -1) return 'Hier'
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    return date.toLocaleDateString('fr-FR')
  }
  const getDateColor = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'text-red-600 font-medium'
    if (diffDays === 0) return 'text-orange-600 font-medium'
    if (diffDays <= 3) return 'text-yellow-600 font-medium'
    return 'text-blue-600'
  }
  return (
    <div className={cn('rounded-lg border p-4', config.bgColor, config.borderColor, className)}>
      <div className="flex items-start gap-3">
        <CreditCard className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={cn('font-medium', config.textColor)}>{config.title}</h3>
            <p className={cn('text-sm mt-1', config.textColor)}>
              {payments.length} paiement{payments.length > 1 ? 's' : ''} • Montant total:{' '}
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="space-y-3">
            {payments.map((payment) => {
              const TypeIcon = typeConfig[payment.type].icon
              return (
                <div key={payment.id} className="bg-white/50 rounded-lg p-3 border border-white/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <TypeIcon className={cn('h-4 w-4 mt-0.5', typeConfig[payment.type].color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {payment.description}
                          </h4>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full bg-gray-100',
                              typeConfig[payment.type].color
                            )}
                          >
                            {typeConfig[payment.type].label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Montant:</span>
                            <span className="ml-2 font-medium">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Échéance:</span>
                            <span className={cn('ml-2', getDateColor(payment.dueDate))}>
                              {formatDate(payment.dueDate)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Créancier:</span>
                            <span className="ml-2">{payment.creditor}</span>
                          </div>
                          {payment.invoiceNumber && (
                            <div>
                              <span className="text-gray-500">N° Facture:</span>
                              <span className="ml-2 font-mono text-xs">
                                {payment.invoiceNumber}
                              </span>
                            </div>
                          )}
                        </div>
                        {payment.overdueDays && payment.overdueDays > 0 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                              <span className="text-red-800 font-medium">
                                En retard de {payment.overdueDays} jour
                                {payment.overdueDays > 1 ? 's' : ''}
                              </span>
                            </div>
                            {payment.lateFee && payment.lateFee > 0 && (
                              <div className="text-red-700 mt-1">
                                Pénalités de retard:{' '}
                                {formatCurrency(payment.lateFee, payment.currency)}
                              </div>
                            )}
                          </div>
                        )}
                        {payment.paymentMethod && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Moyen de paiement:</span>
                            <span className="ml-1">{payment.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {showActions && (
                      <div className="flex flex-col gap-1">
                        {payment.canPayNow && onPayNow && (
                          <button
                            onClick={() => onPayNow(payment.id)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Payer
                          </button>
                        )}
                        {onSchedulePayment && (
                          <button
                            onClick={() => onSchedulePayment(payment.id)}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Programmer
                          </button>
                        )}
                        {onRequestExtension && payment.overdueDays && payment.overdueDays <= 30 && (
                          <button
                            onClick={() => onRequestExtension(payment.id)}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Délai
                          </button>
                        )}
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(payment.id)}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Détails
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Summary */}
          <div className="bg-white/70 rounded-lg p-3 border border-white/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Total à payer:</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
            {urgency === 'overdue' ||
              (urgency === 'critical' && (
                <div className="mt-2 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Des pénalités de retard peuvent s'appliquer
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
