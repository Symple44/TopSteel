'use client'
import {
  AlertTriangle,
  Banknote,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'check' | 'cash' | 'crypto' | 'other'
export interface PaymentMilestone {
  id: string
  title: string
  description?: string
  amount: number
  dueDate: Date
  paidDate?: Date
  status: PaymentStatus
  paymentMethod?: PaymentMethod
  reference?: string
  late?: boolean
  lateFees?: number
  installmentNumber?: number
  totalInstallments?: number
  notes?: string
}
export interface PaymentTimelineProps {
  className?: string
  projectName?: string
  totalAmount: number
  paidAmount: number
  currency?: string
  milestones: PaymentMilestone[]
  compact?: boolean
  showProgress?: boolean
  onMilestoneClick?: (milestoneId: string) => void
  onPaymentAction?: (milestoneId: string, action: 'pay' | 'edit' | 'cancel') => void
}
const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'En attente',
  },
  partial: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TrendingUp,
    label: 'Partiel',
  },
  paid: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Payé',
  },
  overdue: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'En retard',
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
    label: 'Annulé',
  },
  refunded: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: TrendingUp,
    label: 'Remboursé',
  },
}
const paymentMethodConfig = {
  credit_card: { icon: CreditCard, label: 'Carte' },
  bank_transfer: { icon: Building, label: 'Virement' },
  check: { icon: FileText, label: 'Chèque' },
  cash: { icon: Banknote, label: 'Espèces' },
  crypto: { icon: DollarSign, label: 'Crypto' },
  other: { icon: Receipt, label: 'Autre' },
}
export function PaymentTimeline({
  className,
  projectName,
  totalAmount,
  paidAmount,
  currency = 'EUR',
  milestones,
  compact = false,
  showProgress = true,
  onMilestoneClick,
  onPaymentAction,
}: PaymentTimelineProps) {
  const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  const remainingAmount = totalAmount - paidAmount
  const overdueMilestones = milestones.filter((m) => m.status === 'overdue').length
  const pendingMilestones = milestones.filter((m) => m.status === 'pending').length
  const totalLateFees = milestones.reduce((sum, m) => sum + (m.lateFees || 0), 0)
  const getNextPaymentDue = () => {
    const pendingPayments = milestones
      .filter((m) => m.status === 'pending' || m.status === 'overdue')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    return pendingPayments[0] || null
  }
  const nextPayment = getNextPaymentDue()
  if (compact) {
    return (
      <Card className={cn(className, overdueMilestones > 0 && 'border-red-300')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {projectName || 'Paiements'}
                {overdueMilestones > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {paidAmount.toLocaleString('fr-FR')} / {totalAmount.toLocaleString('fr-FR')}{' '}
                {currency}
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={cn(
                  progressPercentage === 100 && 'bg-green-100 text-green-800',
                  overdueMilestones > 0 && 'bg-red-100 text-red-800'
                )}
              >
                {Math.round(progressPercentage)}%
              </Badge>
              {pendingMilestones > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {pendingMilestones} échéance{pendingMilestones > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {showProgress && (
            <Progress
              value={progressPercentage}
              className={cn('h-2', overdueMilestones > 0 && 'progress-red')}
            />
          )}
        </CardHeader>
        {nextPayment && (
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span>Prochain paiement:</span>
              <span
                className={cn('font-medium', nextPayment.status === 'overdue' && 'text-red-600')}
              >
                {nextPayment.amount.toLocaleString('fr-FR')} {currency}
                <span className="text-muted-foreground ml-1">
                  le {nextPayment.dueDate.toLocaleDateString('fr-FR')}
                </span>
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }
  return (
    <Card className={cn(className, overdueMilestones > 0 && 'border-red-300')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {projectName ? `Paiements - ${projectName}` : 'Timeline des paiements'}
              {overdueMilestones > 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total: {totalAmount.toLocaleString('fr-FR')} {currency}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Payé: {paidAmount.toLocaleString('fr-FR')} {currency}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Restant: {remainingAmount.toLocaleString('fr-FR')} {currency}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                progressPercentage === 100 && 'bg-green-100 text-green-800',
                overdueMilestones > 0 && 'bg-red-100 text-red-800'
              )}
            >
              {Math.round(progressPercentage)}% payé
            </Badge>
            {(pendingMilestones > 0 || overdueMilestones > 0) && (
              <div className="space-y-1">
                {pendingMilestones > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {pendingMilestones} paiement{pendingMilestones > 1 ? 's' : ''} en attente
                  </div>
                )}
                {overdueMilestones > 0 && (
                  <div className="text-xs text-red-600 font-medium">
                    {overdueMilestones} paiement{overdueMilestones > 1 ? 's' : ''} en retard
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {showProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression des paiements</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={cn('h-3', overdueMilestones > 0 && 'progress-red')}
            />
          </div>
        )}
        {totalLateFees > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Pénalités de retard: {totalLateFees.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone, index) => {
          const StatusIcon = statusConfig[milestone.status].icon
          const PaymentMethodIcon = milestone.paymentMethod
            ? paymentMethodConfig[milestone.paymentMethod].icon
            : Receipt
          const isClickable =
            onMilestoneClick && (milestone.status === 'paid' || milestone.status === 'partial')
          const isOverdue = milestone.status === 'overdue'
          const isPending = milestone.status === 'pending'
          return (
            <div key={milestone.id} className="relative">
              {/* Connection line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-200" />
              )}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive */}
              <div
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border transition-all',
                  milestone.status === 'paid' && 'border-green-300 bg-green-50/30',
                  milestone.status === 'partial' && 'border-blue-300 bg-blue-50/30',
                  milestone.status === 'overdue' && 'border-red-300 bg-red-50/30',
                  milestone.status === 'pending' && 'border-yellow-300 bg-yellow-50/30',
                  milestone.status === 'cancelled' && 'border-gray-300 bg-gray-50/30',
                  isClickable && 'cursor-pointer hover:shadow-sm'
                )}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onMilestoneClick(milestone.id) : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onMilestoneClick(milestone.id)
                  }
                }}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2',
                    milestone.status === 'paid' && 'bg-green-100 border-green-300 text-green-600',
                    milestone.status === 'partial' && 'bg-blue-100 border-blue-300 text-blue-600',
                    milestone.status === 'overdue' && 'bg-red-100 border-red-300 text-red-600',
                    milestone.status === 'pending' &&
                      'bg-yellow-100 border-yellow-300 text-yellow-600',
                    milestone.status === 'cancelled' && 'bg-gray-100 border-gray-300 text-gray-600',
                    milestone.status === 'refunded' &&
                      'bg-purple-100 border-purple-300 text-purple-600'
                  )}
                >
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                    <Badge variant="outline" className={statusConfig[milestone.status].color}>
                      {statusConfig[milestone.status].label}
                    </Badge>
                    {milestone.installmentNumber && milestone.totalInstallments && (
                      <Badge variant="outline" className="text-xs">
                        {milestone.installmentNumber}/{milestone.totalInstallments}
                      </Badge>
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {milestone.amount.toLocaleString('fr-FR')} {currency}
                      </div>
                      {milestone.lateFees && milestone.lateFees > 0 && (
                        <div className="text-sm text-red-600">
                          + {milestone.lateFees.toLocaleString('fr-FR')} {currency} (pénalités)
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          Échéance: {milestone.dueDate.toLocaleDateString('fr-FR')}
                          {isOverdue && ' (En retard)'}
                        </span>
                      </div>
                      {milestone.paidDate && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Payé le: {milestone.paidDate.toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {milestone.paymentMethod && (
                        <div className="flex items-center gap-1">
                          <PaymentMethodIcon className="h-3 w-3" />
                          {paymentMethodConfig[milestone.paymentMethod].label}
                        </div>
                      )}
                      {milestone.reference && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Réf: {milestone.reference}
                        </div>
                      )}
                    </div>
                  </div>
                  {milestone.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{milestone.notes}</p>
                    </div>
                  )}
                  {/* Action buttons for pending/overdue payments */}
                  {(isPending || isOverdue) && onPaymentAction && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onPaymentAction(milestone.id, 'pay')
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Marquer comme payé
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onPaymentAction(milestone.id, 'edit')
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {milestone.status === 'paid' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {milestone.status === 'overdue' && (
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  )}
                  {milestone.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
