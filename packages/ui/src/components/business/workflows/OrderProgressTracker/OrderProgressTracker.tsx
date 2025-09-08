'use client'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Scale,
  ShoppingCart,
  Truck,
  User,
  Wrench,
} from 'lucide-react'
import type React from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_processing'
  | 'payment_confirmed'
  | 'in_production'
  | 'quality_control'
  | 'ready_for_shipment'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
export interface OrderStep {
  id: string
  title: string
  description?: string
  status: 'completed' | 'current' | 'pending' | 'error'
  completedAt?: Date
  estimatedDate?: Date
  actualDate?: Date
  details?: {
    assignedTo?: string
    location?: string
    notes?: string
    documents?: Array<{ name: string; url: string }>
  }
}
export interface OrderProgressTrackerProps {
  className?: string
  orderNumber: string
  orderStatus: OrderStatus
  customerName: string
  orderDate: Date
  estimatedDelivery?: Date
  actualDelivery?: Date
  steps?: OrderStep[]
  customSteps?: OrderStep[]
  totalAmount?: number
  currency?: string
  urgentOrder?: boolean
  compact?: boolean
  showDetails?: boolean
  onStepClick?: (stepId: string) => void
}
const defaultSteps: Record<string, Omit<OrderStep, 'status' | 'completedAt'>> = {
  order_placed: {
    id: 'order_placed',
    title: 'Commande passée',
    description: 'Commande reçue et enregistrée dans le système',
  },
  payment_processing: {
    id: 'payment_processing',
    title: 'Traitement du paiement',
    description: 'Vérification et traitement du paiement',
  },
  order_confirmed: {
    id: 'order_confirmed',
    title: 'Commande confirmée',
    description: 'Commande validée et prête pour production',
  },
  material_preparation: {
    id: 'material_preparation',
    title: 'Préparation matériaux',
    description: 'Préparation et allocation des matériaux nécessaires',
  },
  production: {
    id: 'production',
    title: 'Production',
    description: 'Fabrication et usinage des pièces',
  },
  quality_control: {
    id: 'quality_control',
    title: 'Contrôle qualité',
    description: 'Inspection et validation de la qualité',
  },
  packaging: {
    id: 'packaging',
    title: 'Emballage',
    description: 'Emballage et préparation pour expédition',
  },
  shipping: {
    id: 'shipping',
    title: 'Expédition',
    description: 'Expédition vers le client',
  },
  delivered: {
    id: 'delivered',
    title: 'Livré',
    description: 'Commande livrée au client',
  },
}
const statusStepMapping: Record<OrderStatus, string[]> = {
  pending: ['order_placed'],
  confirmed: ['order_placed', 'order_confirmed'],
  payment_processing: ['order_placed', 'payment_processing'],
  payment_confirmed: ['order_placed', 'payment_processing', 'order_confirmed'],
  in_production: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
  ],
  quality_control: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
    'quality_control',
  ],
  ready_for_shipment: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
    'quality_control',
    'packaging',
  ],
  shipped: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
    'quality_control',
    'packaging',
    'shipping',
  ],
  delivered: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
    'quality_control',
    'packaging',
    'shipping',
    'delivered',
  ],
  completed: [
    'order_placed',
    'payment_processing',
    'order_confirmed',
    'material_preparation',
    'production',
    'quality_control',
    'packaging',
    'shipping',
    'delivered',
  ],
  cancelled: [],
}
const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  order_placed: ShoppingCart,
  payment_processing: CreditCard,
  order_confirmed: CheckCircle2,
  material_preparation: Scale,
  production: Wrench,
  quality_control: FileText,
  packaging: Package,
  shipping: Truck,
  delivered: MapPin,
}
const statusColors = {
  completed: 'text-green-600 bg-green-100',
  current: 'text-blue-600 bg-blue-100',
  pending: 'text-gray-400 bg-gray-100',
  error: 'text-red-600 bg-red-100',
}
export function OrderProgressTracker({
  className,
  orderNumber,
  orderStatus,
  customerName,
  orderDate,
  estimatedDelivery,
  actualDelivery,
  steps: customSteps,
  totalAmount,
  currency = 'EUR',
  urgentOrder = false,
  compact = false,
  showDetails = true,
  onStepClick,
}: OrderProgressTrackerProps) {
  // Generate steps based on order status if no custom steps provided
  const generateStepsFromStatus = (): OrderStep[] => {
    const completedStepIds = statusStepMapping[orderStatus] || []
    const allStepIds = Object.keys(defaultSteps)
    return allStepIds.map((stepId) => {
      const stepIndex = completedStepIds.indexOf(stepId)
      const isCompleted = stepIndex !== -1
      const isCurrentStep =
        stepIndex === completedStepIds.length - 1 &&
        orderStatus !== 'completed' &&
        orderStatus !== 'cancelled'
      let status: OrderStep['status'] = 'pending'
      if (isCompleted && !isCurrentStep) status = 'completed'
      else if (isCurrentStep) status = 'current'
      else if (orderStatus === 'cancelled') status = 'error'
      return {
        ...defaultSteps[stepId],
        status,
      }
    })
  }
  const steps = customSteps || generateStepsFromStatus()
  const completedSteps = steps.filter((step) => step.status === 'completed').length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const isOverdue = estimatedDelivery && !actualDelivery && new Date() > estimatedDelivery
  const isUrgent = urgentOrder || isOverdue
  if (compact) {
    return (
      <Card className={cn(className, isUrgent && 'border-orange-300')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {orderNumber}
                {isUrgent && <AlertTriangle className="h-4 w-4 text-orange-500" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{customerName}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                orderStatus === 'completed' && 'bg-green-100 text-green-800',
                orderStatus === 'cancelled' && 'bg-red-100 text-red-800',
                (orderStatus === 'shipped' || orderStatus === 'delivered') &&
                  'bg-blue-100 text-blue-800'
              )}
            >
              {orderStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {completedSteps}/{totalSteps} étapes
            </span>
            {estimatedDelivery && (
              <span className={isOverdue ? 'text-red-600' : ''}>
                {isOverdue
                  ? 'En retard'
                  : `Livraison: ${estimatedDelivery.toLocaleDateString('fr-FR')}`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className={cn(className, isUrgent && 'border-orange-300')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Commande {orderNumber}
              {isUrgent && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {customerName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {orderDate.toLocaleDateString('fr-FR')}
              </div>
              {totalAmount && (
                <div>
                  {totalAmount.toLocaleString('fr-FR')} {currency}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                orderStatus === 'completed' && 'bg-green-100 text-green-800',
                orderStatus === 'cancelled' && 'bg-red-100 text-red-800',
                (orderStatus === 'shipped' || orderStatus === 'delivered') &&
                  'bg-blue-100 text-blue-800'
              )}
            >
              {orderStatus.replace('_', ' ').toUpperCase()}
            </Badge>
            {estimatedDelivery && (
              <div
                className={cn(
                  'text-sm',
                  isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                )}
              >
                {isOverdue && 'En retard - '}
                Livraison prévue: {estimatedDelivery.toLocaleDateString('fr-FR')}
              </div>
            )}
            {actualDelivery && (
              <div className="text-sm text-green-600 font-medium">
                Livré le: {actualDelivery.toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{totalSteps} étapes ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const StepIcon = stepIcons[step.id] || Clock
          const isClickable =
            onStepClick && (step.status === 'completed' || step.status === 'current')
          return (
            <div key={step.id} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
              )}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive */}
              <div
                className={cn(
                  'flex items-start gap-4 p-3 rounded-lg border transition-all',
                  step.status === 'current' && 'border-blue-300 bg-blue-50/50',
                  step.status === 'completed' && 'border-green-300 bg-green-50/30',
                  step.status === 'error' && 'border-red-300 bg-red-50/30',
                  isClickable && 'cursor-pointer hover:shadow-sm'
                )}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onStepClick(step.id) : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onStepClick(step.id)
                  }
                }}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2',
                    statusColors[step.status]
                  )}
                >
                  <StepIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    {step.status === 'current' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        En cours
                      </Badge>
                    )}
                    {step.status === 'completed' && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Terminé
                      </Badge>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  )}
                  {showDetails && step.details && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {step.details.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Assigné à: {step.details.assignedTo}
                        </div>
                      )}
                      {step.details.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Localisation: {step.details.location}
                        </div>
                      )}
                      {step.details.notes && (
                        <div className="text-gray-600 mt-1">{step.details.notes}</div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {step.completedAt && (
                      <span>Terminé le {step.completedAt.toLocaleDateString('fr-FR')}</span>
                    )}
                    {step.estimatedDate && !step.completedAt && (
                      <span>Prévu le {step.estimatedDate.toLocaleDateString('fr-FR')}</span>
                    )}
                    {step.actualDate &&
                      step.estimatedDate &&
                      step.actualDate > step.estimatedDate && (
                        <span className="text-orange-600">En retard</span>
                      )}
                  </div>
                </div>
                {step.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                {step.status === 'current' && (
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 animate-pulse" />
                )}
                {step.status === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
