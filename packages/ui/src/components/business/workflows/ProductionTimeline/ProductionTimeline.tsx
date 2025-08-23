'use client'
import React from 'react'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Progress } from '../../../data-display/progress/progress'
import { cn } from '../../../../lib/utils'
import { 
  Factory, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Gauge,
  Thermometer,
  Zap,
  Settings,
  Package,
  Scale,
  Shield,
  Play,
  Pause,
  StopCircle
} from 'lucide-react'
export type ProductionStatus = 
  | 'planned' 
  | 'queued' 
  | 'in_progress' 
  | 'paused' 
  | 'quality_check' 
  | 'completed' 
  | 'delayed' 
  | 'cancelled'
export type ProductionPriority = 'low' | 'normal' | 'high' | 'urgent'
export interface ProductionOperation {
  id: string
  name: string
  description?: string
  status: ProductionStatus
  priority: ProductionPriority
  workstation: string
  operator?: string
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate?: Date
  actualEndDate?: Date
  duration?: string
  estimatedDuration: string
  progress?: number
  materials?: Array<{
    name: string
    quantity: number
    unit: string
    available: boolean
  }>
  qualityChecks?: Array<{
    name: string
    status: 'pending' | 'passed' | 'failed'
    value?: number
    unit?: string
    target?: number
    tolerance?: number
  }>
  machineSettings?: Array<{
    parameter: string
    value: string
    unit?: string
  }>
  temperature?: number
  pressure?: number
  speed?: number
  issues?: Array<{
    id: string
    description: string
    severity: 'low' | 'medium' | 'high'
    reportedAt: Date
    resolvedAt?: Date
  }>
  notes?: string
}
export interface ProductionTimelineProps {
  className?: string
  productName: string
  orderNumber?: string
  operations: ProductionOperation[]
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate?: Date
  actualEndDate?: Date
  totalProgress?: number
  compact?: boolean
  showProgress?: boolean
  showDetails?: boolean
  onOperationClick?: (operationId: string) => void
  onOperationAction?: (operationId: string, action: 'start' | 'pause' | 'complete' | 'quality_check') => void
}
const statusConfig = {
  planned: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Calendar,
    label: 'Planifié',
    bgColor: 'bg-gray-50/30'
  },
  queued: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'En attente',
    bgColor: 'bg-yellow-50/30'
  },
  in_progress: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    label: 'En cours',
    bgColor: 'bg-blue-50/30'
  },
  paused: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Pause,
    label: 'En pause',
    bgColor: 'bg-orange-50/30'
  },
  quality_check: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Shield,
    label: 'Contrôle qualité',
    bgColor: 'bg-purple-50/30'
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Terminé',
    bgColor: 'bg-green-50/30'
  },
  delayed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'En retard',
    bgColor: 'bg-red-50/30'
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: StopCircle,
    label: 'Annulé',
    bgColor: 'bg-gray-50/30'
  }
}
const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Basse' },
  normal: { color: 'bg-blue-100 text-blue-800', label: 'Normale' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'Haute' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
}
export function ProductionTimeline({
  className,
  productName,
  orderNumber,
  operations,
  plannedStartDate,
  plannedEndDate,
  actualStartDate,
  actualEndDate,
  totalProgress = 0,
  compact = false,
  showProgress = true,
  showDetails = true,
  onOperationClick,
  onOperationAction
}: ProductionTimelineProps) {
  const completedOperations = operations.filter(op => op.status === 'completed').length
  const totalOperations = operations.length
  const calculatedProgress = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0
  const progressPercentage = totalProgress || calculatedProgress
  const currentOperation = operations.find(op => op.status === 'in_progress')
  const delayedOperations = operations.filter(op => op.status === 'delayed').length
  const pausedOperations = operations.filter(op => op.status === 'paused').length
  const isDelayed = actualEndDate ? actualEndDate > plannedEndDate : new Date() > plannedEndDate
  const hasIssues = operations.some(op => op.issues && op.issues.length > 0)
  if (compact) {
    return (
      <Card className={cn(className, isDelayed && "border-red-300")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {productName}
                {isDelayed && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {hasIssues && <AlertTriangle className="h-4 w-4 text-orange-500" />}
              </CardTitle>
              {orderNumber && (
                <p className="text-sm text-muted-foreground">Commande {orderNumber}</p>
              )}
            </div>
            <div className="text-right">
              <Badge 
                variant="outline"
                className={cn(
                  progressPercentage === 100 && "bg-green-100 text-green-800",
                  isDelayed && "bg-red-100 text-red-800"
                )}
              >
                {Math.round(progressPercentage)}%
              </Badge>
              {currentOperation && (
                <div className="text-xs text-muted-foreground mt-1">
                  {currentOperation.name}
                </div>
              )}
            </div>
          </div>
          {showProgress && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completedOperations}/{totalOperations} opérations</span>
            <span className={isDelayed ? 'text-red-600' : ''}>
              {isDelayed ? 'En retard' : `Fin prévue: ${plannedEndDate.toLocaleDateString('fr-FR')}`}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className={cn(className, isDelayed && "border-red-300")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Production - {productName}
              {isDelayed && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {hasIssues && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {orderNumber && (
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Commande {orderNumber}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Début: {plannedStartDate.toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fin prévue: {plannedEndDate.toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant="outline"
              className={cn(
                "mb-2",
                progressPercentage === 100 && "bg-green-100 text-green-800",
                isDelayed && "bg-red-100 text-red-800"
              )}
            >
              {Math.round(progressPercentage)}% terminé
            </Badge>
            <div className="space-y-1">
              {delayedOperations > 0 && (
                <div className="text-xs text-red-600 font-medium">
                  {delayedOperations} opération{delayedOperations > 1 ? 's' : ''} en retard
                </div>
              )}
              {pausedOperations > 0 && (
                <div className="text-xs text-orange-600">
                  {pausedOperations} opération{pausedOperations > 1 ? 's' : ''} en pause
                </div>
              )}
            </div>
          </div>
        </div>
        {showProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression de la production</span>
              <span className="text-sm text-muted-foreground">
                {completedOperations}/{totalOperations} opérations ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        )}
        {actualStartDate && (
          <div className="mt-3 text-sm text-muted-foreground">
            Démarré le: {actualStartDate.toLocaleDateString('fr-FR')} à {actualStartDate.toLocaleTimeString('fr-FR')}
          </div>
        )}
        {actualEndDate && (
          <div className="mt-1 text-sm text-green-600 font-medium">
            Terminé le: {actualEndDate.toLocaleDateString('fr-FR')} à {actualEndDate.toLocaleTimeString('fr-FR')}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {operations.map((operation, index) => {
          const StatusIcon = statusConfig[operation.status].icon
          const isClickable = onOperationClick && (operation.status === 'completed' || operation.status === 'in_progress')
          const isOverdue = operation.actualEndDate ? 
            operation.actualEndDate > operation.plannedEndDate : 
            new Date() > operation.plannedEndDate && operation.status !== 'completed'
          return (
            <div key={operation.id} className="relative">
              {/* Connection line */}
              {index < operations.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200" />
              )}
              <div 
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  `border-${statusConfig[operation.status].color.split(' ')[2].split('-')[1]}-300`,
                  statusConfig[operation.status].bgColor,
                  isClickable && "cursor-pointer hover:shadow-sm"
                )}
                onClick={isClickable ? () => onOperationClick(operation.id) : undefined}
              >
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2",
                  operation.status === 'completed' && "bg-green-100 border-green-300 text-green-600",
                  operation.status === 'in_progress' && "bg-blue-100 border-blue-300 text-blue-600",
                  operation.status === 'delayed' && "bg-red-100 border-red-300 text-red-600",
                  operation.status === 'paused' && "bg-orange-100 border-orange-300 text-orange-600",
                  operation.status === 'quality_check' && "bg-purple-100 border-purple-300 text-purple-600",
                  operation.status === 'queued' && "bg-yellow-100 border-yellow-300 text-yellow-600",
                  operation.status === 'planned' && "bg-gray-100 border-gray-300 text-gray-600",
                  operation.status === 'cancelled' && "bg-gray-100 border-gray-300 text-gray-600"
                )}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{operation.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={statusConfig[operation.status].color}
                    >
                      {statusConfig[operation.status].label}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={priorityConfig[operation.priority].color}
                    >
                      {priorityConfig[operation.priority].label}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        En retard
                      </Badge>
                    )}
                  </div>
                  {operation.description && (
                    <p className="text-sm text-gray-600 mb-3">{operation.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Station: {operation.workstation}</span>
                      </div>
                      {operation.operator && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Opérateur: {operation.operator}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Durée estimée: {operation.estimatedDuration}</span>
                      </div>
                      {operation.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Durée réelle: {operation.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Planifié: {operation.plannedStartDate.toLocaleDateString('fr-FR')} - {operation.plannedEndDate.toLocaleDateString('fr-FR')}
                      </div>
                      {operation.actualStartDate && (
                        <div className="text-sm text-green-600">
                          Démarré: {operation.actualStartDate.toLocaleDateString('fr-FR')} à {operation.actualStartDate.toLocaleTimeString('fr-FR')}
                        </div>
                      )}
                      {operation.actualEndDate && (
                        <div className="text-sm text-green-600">
                          Terminé: {operation.actualEndDate.toLocaleDateString('fr-FR')} à {operation.actualEndDate.toLocaleTimeString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Progress bar for current operation */}
                  {operation.status === 'in_progress' && operation.progress !== undefined && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{operation.progress}%</span>
                      </div>
                      <Progress value={operation.progress} className="h-2" />
                    </div>
                  )}
                  {/* Machine parameters for active operations */}
                  {showDetails && operation.status === 'in_progress' && (
                    <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-blue-50 rounded-lg">
                      {operation.temperature !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <Thermometer className="h-4 w-4 text-blue-600" />
                          <span>{operation.temperature}°C</span>
                        </div>
                      )}
                      {operation.pressure !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <Gauge className="h-4 w-4 text-blue-600" />
                          <span>{operation.pressure} bar</span>
                        </div>
                      )}
                      {operation.speed !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <span>{operation.speed} rpm</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Materials */}
                  {showDetails && operation.materials && operation.materials.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        Matériaux
                      </h4>
                      <div className="space-y-1">
                        {operation.materials.map((material, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{material.name}</span>
                            <div className="flex items-center gap-2">
                              <span>{material.quantity} {material.unit}</span>
                              <Badge 
                                variant="outline" 
                                className={material.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {material.available ? 'Disponible' : 'Manquant'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Quality checks */}
                  {showDetails && operation.qualityChecks && operation.qualityChecks.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Contrôles qualité
                      </h4>
                      <div className="space-y-1">
                        {operation.qualityChecks.map((check, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{check.name}</span>
                            <div className="flex items-center gap-2">
                              {check.value !== undefined && (
                                <span>{check.value} {check.unit}</span>
                              )}
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  check.status === 'passed' && "bg-green-100 text-green-800",
                                  check.status === 'failed' && "bg-red-100 text-red-800",
                                  check.status === 'pending' && "bg-yellow-100 text-yellow-800"
                                )}
                              >
                                {check.status === 'passed' && 'Conforme'}
                                {check.status === 'failed' && 'Non conforme'}
                                {check.status === 'pending' && 'En attente'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Issues */}
                  {operation.issues && operation.issues.length > 0 && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Problèmes signalés</h4>
                      {operation.issues.map((issue) => (
                        <div key={issue.id} className="text-sm text-red-700 mb-1">
                          • {issue.description}
                          {issue.resolvedAt ? (
                            <span className="text-green-600 ml-2">(Résolu)</span>
                          ) : (
                            <Badge variant="outline" className={cn(
                              "ml-2 text-xs",
                              issue.severity === 'high' && "bg-red-100 text-red-800",
                              issue.severity === 'medium' && "bg-orange-100 text-orange-800",
                              issue.severity === 'low' && "bg-yellow-100 text-yellow-800"
                            )}>
                              {issue.severity}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {operation.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{operation.notes}</p>
                    </div>
                  )}
                  {/* Action buttons */}
                  {operation.status === 'queued' && onOperationAction && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOperationAction(operation.id, 'start')
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4 mr-1 inline" />
                        Démarrer
                      </button>
                    </div>
                  )}
                  {operation.status === 'in_progress' && onOperationAction && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOperationAction(operation.id, 'pause')
                        }}
                        className="px-3 py-1 text-sm border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 transition-colors"
                      >
                        <Pause className="w-4 h-4 mr-1 inline" />
                        Pause
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOperationAction(operation.id, 'quality_check')
                        }}
                        className="px-3 py-1 text-sm border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-1 inline" />
                        Contrôle qualité
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOperationAction(operation.id, 'complete')
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1 inline" />
                        Terminer
                      </button>
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {operation.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {operation.status === 'in_progress' && (
                    <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                  )}
                  {operation.status === 'delayed' && (
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  )}
                  {operation.status === 'paused' && (
                    <Pause className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
