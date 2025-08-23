'use client'
import React from 'react'
import { Badge } from '../../../data-display/badge'
import { Button } from '../../../primitives/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Progress } from '../../../data-display/progress/progress'
import { cn } from '../../../../lib/utils'
import { 
  CheckCircle2, 
  Circle,
  Clock, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  SkipForward,
  RotateCcw
} from 'lucide-react'
export type StepStatus = 'completed' | 'current' | 'pending' | 'skipped' | 'error'
export interface ProcessStep {
  id: string
  title: string
  description?: string
  status: StepStatus
  optional?: boolean
  estimated?: string
  actual?: string
  completedAt?: Date
  startedAt?: Date
  error?: string
  icon?: React.ComponentType<any>
  content?: React.ReactNode
  actions?: Array<{
    id: string
    label: string
    action: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
    disabled?: boolean
  }>
}
export interface ProcessStepperProps {
  className?: string
  steps: ProcessStep[]
  currentStep?: number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'compact' | 'minimal'
  showProgress?: boolean
  allowNavigation?: boolean
  allowSkipping?: boolean
  title?: string
  description?: string
  onStepClick?: (stepIndex: number) => void
  onStepComplete?: (stepIndex: number) => void
  onStepSkip?: (stepIndex: number) => void
  onStepRetry?: (stepIndex: number) => void
}
const statusConfig = {
  completed: {
    color: 'text-green-600 border-green-300 bg-green-50',
    icon: CheckCircle2,
    label: 'Terminé',
    badgeColor: 'bg-green-100 text-green-800'
  },
  current: {
    color: 'text-blue-600 border-blue-300 bg-blue-50',
    icon: Play,
    label: 'En cours',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  pending: {
    color: 'text-gray-400 border-gray-200 bg-gray-50',
    icon: Circle,
    label: 'En attente',
    badgeColor: 'bg-gray-100 text-gray-600'
  },
  skipped: {
    color: 'text-orange-400 border-orange-200 bg-orange-50',
    icon: SkipForward,
    label: 'Ignoré',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  error: {
    color: 'text-red-600 border-red-300 bg-red-50',
    icon: AlertTriangle,
    label: 'Erreur',
    badgeColor: 'bg-red-100 text-red-800'
  }
}
export function ProcessStepper({
  className,
  steps,
  currentStep = 0,
  orientation = 'vertical',
  variant = 'default',
  showProgress = true,
  allowNavigation = false,
  allowSkipping = false,
  title,
  description,
  onStepClick,
  onStepComplete,
  onStepSkip,
  onStepRetry
}: ProcessStepperProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const getCurrentStepIndex = () => {
    const current = steps.findIndex(step => step.status === 'current')
    return current !== -1 ? current : currentStep
  }
  const currentStepIndex = getCurrentStepIndex()
  const handleStepClick = (index: number) => {
    if (!allowNavigation) return
    const step = steps[index]
    if (step.status === 'completed' || step.status === 'current') {
      onStepClick?.(index)
    }
  }
  const renderStepIcon = (step: ProcessStep, index: number) => {
    const StepIcon = step.icon || statusConfig[step.status].icon
    if (variant === 'minimal') {
      return (
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
          statusConfig[step.status].color
        )}>
          {step.status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      )
    }
    return (
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
        statusConfig[step.status].color,
        allowNavigation && (step.status === 'completed' || step.status === 'current') && "cursor-pointer hover:scale-105"
      )}>
        <StepIcon className="w-5 h-5" />
      </div>
    )
  }
  const renderStepContent = (step: ProcessStep, index: number) => {
    const isActive = index === currentStepIndex
    const config = statusConfig[step.status]
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn(
            "font-semibold",
            step.status === 'current' && "text-blue-900",
            step.status === 'completed' && "text-green-900",
            step.status === 'error' && "text-red-900",
            step.status === 'pending' && "text-gray-600"
          )}>
            {step.title}
            {step.optional && (
              <span className="text-xs text-muted-foreground ml-1">(optionnel)</span>
            )}
          </h3>
          {variant !== 'minimal' && (
            <Badge variant="outline" className={config.badgeColor}>
              {config.label}
            </Badge>
          )}
        </div>
        {step.description && (
          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
        )}
        {/* Timing information */}
        {(step.estimated || step.actual || step.startedAt || step.completedAt) && (
          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
            {step.estimated && (
              <span>Estimé: {step.estimated}</span>
            )}
            {step.actual && step.status === 'completed' && (
              <span>Réel: {step.actual}</span>
            )}
            {step.startedAt && step.status === 'current' && (
              <span>Démarré: {step.startedAt.toLocaleTimeString('fr-FR')}</span>
            )}
            {step.completedAt && step.status === 'completed' && (
              <span>Terminé: {step.completedAt.toLocaleTimeString('fr-FR')}</span>
            )}
          </div>
        )}
        {/* Error message */}
        {step.error && step.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            <p className="text-sm text-red-800">{step.error}</p>
          </div>
        )}
        {/* Step content */}
        {isActive && step.content && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            {step.content}
          </div>
        )}
        {/* Actions */}
        {isActive && step.actions && step.actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {step.actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant || 'default'}
                onClick={action.action}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        {/* Default actions */}
        {isActive && !step.actions && (
          <div className="flex gap-2 mt-3">
            {step.status === 'current' && onStepComplete && (
              <Button
                size="sm"
                onClick={() => onStepComplete(index)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Terminer
              </Button>
            )}
            {step.status === 'current' && allowSkipping && step.optional && onStepSkip && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStepSkip(index)}
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Ignorer
              </Button>
            )}
            {step.status === 'error' && onStepRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStepRetry(index)}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Réessayer
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2",
                      statusConfig[step.status].color,
                      allowNavigation && "cursor-pointer"
                    )}
                    onClick={() => handleStepClick(index)}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-200" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{steps[currentStepIndex]?.title}</p>
              <p className="text-xs text-muted-foreground">
                Étape {currentStepIndex + 1} sur {totalSteps}
              </p>
            </div>
            {showProgress && (
              <div className="text-right">
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  if (orientation === 'horizontal') {
    return (
      <Card className={className}>
        {(title || description || showProgress) && (
          <CardHeader className="pb-4">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            {showProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span>{completedSteps}/{totalSteps} étapes ({Math.round(progressPercentage)}%)</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 min-w-0">
                <div 
                  className="flex flex-col items-center gap-2 min-w-max cursor-pointer"
                  onClick={() => handleStepClick(index)}
                >
                  {renderStepIcon(step, index)}
                  <div className="text-center">
                    <p className="text-xs font-medium truncate max-w-20">{step.title}</p>
                    {variant !== 'minimal' && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs mt-1", statusConfig[step.status].badgeColor)}
                      >
                        {statusConfig[step.status].label}
                      </Badge>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          {/* Current step details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            {renderStepContent(steps[currentStepIndex], currentStepIndex)}
          </div>
        </CardContent>
      </Card>
    )
  }
  // Vertical layout (default)
  return (
    <Card className={className}>
      {(title || description || showProgress) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          {showProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression</span>
                <span>{completedSteps}/{totalSteps} étapes ({Math.round(progressPercentage)}%)</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="absolute left-5 top-14 w-0.5 h-12 bg-gray-200" />
            )}
            <div 
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg border transition-all",
                step.status === 'current' && "border-blue-300 bg-blue-50/50",
                step.status === 'completed' && "border-green-300 bg-green-50/30",
                step.status === 'error' && "border-red-300 bg-red-50/30",
                allowNavigation && (step.status === 'completed' || step.status === 'current') && "cursor-pointer hover:shadow-sm"
              )}
              onClick={() => handleStepClick(index)}
            >
              {renderStepIcon(step, index)}
              {renderStepContent(step, index)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
