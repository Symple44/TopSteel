'use client'

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'
import { cn } from '../../../lib/utils'

export interface WizardStep {
  /** Unique step identifier */
  id: string
  /** Step title */
  title: string
  /** Step description (optional) */
  description?: string
  /** Step content component */
  content: React.ReactNode
  /** Validation function - return true if step is valid */
  validate?: () => boolean | Promise<boolean>
  /** Whether step is optional */
  optional?: boolean
}

export interface FormWizardProps {
  /** Wizard steps configuration */
  steps: WizardStep[]
  /** Callback when wizard completes */
  onComplete: () => void | Promise<void>
  /** Callback on step change */
  onStepChange?: (stepIndex: number, stepId: string) => void
  /** Initial step index */
  initialStep?: number
  /** Show step numbers */
  showStepNumbers?: boolean
  /** Allow clicking on steps to navigate */
  allowStepClick?: boolean
  /** Custom class name */
  className?: string
  /** Labels */
  labels?: {
    previous?: string
    next?: string
    complete?: string
    step?: string
    of?: string
    optional?: string
  }
}

const defaultLabels = {
  previous: 'Précédent',
  next: 'Suivant',
  complete: 'Terminer',
  step: 'Étape',
  of: 'sur',
  optional: 'Optionnel',
}

interface WizardContextValue {
  currentStep: number
  totalSteps: number
  goToStep: (index: number) => void
  nextStep: () => void
  previousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
  isStepCompleted: (index: number) => boolean
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a FormWizard')
  }
  return context
}

/**
 * FormWizard component for multi-step forms
 * Accessible with keyboard navigation and screen reader support
 */
export function FormWizard({
  steps,
  onComplete,
  onStepChange,
  initialStep = 0,
  showStepNumbers = true,
  allowStepClick = true,
  className,
  labels: customLabels,
}: FormWizardProps) {
  const labels = { ...defaultLabels, ...customLabels }
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const totalSteps = steps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const currentStepData = steps[currentStep]

  const isStepCompleted = useCallback((index: number) => completedSteps.has(index), [completedSteps])

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep]
    if (!step.validate) return true

    const result = step.validate()
    return result instanceof Promise ? await result : result
  }, [currentStep, steps])

  const goToStep = useCallback(async (index: number) => {
    if (index < 0 || index >= totalSteps) return
    if (index === currentStep) return

    // Can only go back or to completed steps, or validate current to go forward
    if (index < currentStep || completedSteps.has(index)) {
      setCurrentStep(index)
      onStepChange?.(index, steps[index].id)
    } else if (index === currentStep + 1) {
      // Going to next step - validate current
      setIsLoading(true)
      try {
        const isValid = await validateCurrentStep()
        if (isValid) {
          setCompletedSteps((prev) => new Set(prev).add(currentStep))
          setCurrentStep(index)
          onStepChange?.(index, steps[index].id)
        }
      } finally {
        setIsLoading(false)
      }
    }
  }, [currentStep, totalSteps, completedSteps, onStepChange, steps, validateCurrentStep])

  const nextStep = useCallback(async () => {
    if (isLastStep) {
      setIsLoading(true)
      try {
        const isValid = await validateCurrentStep()
        if (isValid) {
          setCompletedSteps((prev) => new Set(prev).add(currentStep))
          await onComplete()
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      goToStep(currentStep + 1)
    }
  }, [isLastStep, currentStep, goToStep, onComplete, validateCurrentStep])

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1)
    }
  }, [isFirstStep, currentStep, goToStep])

  const contextValue: WizardContextValue = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
    isStepCompleted,
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn('space-y-8', className)}>
        {/* Step indicator */}
        <nav aria-label="Progression du formulaire">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = completedSteps.has(index)
              const isClickable = allowStepClick && (index < currentStep || isCompleted)

              return (
                <li
                  key={step.id}
                  className={cn(
                    'flex-1 relative',
                    index < totalSteps - 1 && 'pr-8 sm:pr-20'
                  )}
                >
                  {/* Connector line */}
                  {index < totalSteps - 1 && (
                    <div
                      className={cn(
                        'absolute top-5 left-10 right-0 h-0.5',
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => isClickable && goToStep(index)}
                    disabled={!isClickable}
                    className={cn(
                      'group flex flex-col items-center',
                      isClickable && 'cursor-pointer',
                      !isClickable && 'cursor-default'
                    )}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {/* Step circle */}
                    <span
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isCompleted && 'bg-primary border-primary text-primary-foreground',
                        isActive && !isCompleted && 'border-primary text-primary',
                        !isActive && !isCompleted && 'border-muted text-muted-foreground',
                        isClickable && 'group-hover:border-primary/70'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" aria-hidden="true" />
                      ) : showStepNumbers ? (
                        index + 1
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-current" />
                      )}
                    </span>

                    {/* Step title */}
                    <span
                      className={cn(
                        'mt-2 text-sm font-medium text-center hidden sm:block',
                        isActive && 'text-primary',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                      {step.optional && (
                        <span className="block text-xs font-normal">({labels.optional})</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* Mobile step indicator */}
          <div className="sm:hidden mt-4 text-center text-sm text-muted-foreground">
            {labels.step} {currentStep + 1} {labels.of} {totalSteps}: {currentStepData.title}
          </div>
        </nav>

        {/* Step content */}
        <div className="min-h-[200px]">
          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
            {currentStepData.description && (
              <p className="mt-1 text-sm text-muted-foreground">{currentStepData.description}</p>
            )}
          </div>

          {/* Step content */}
          <div role="tabpanel" aria-label={currentStepData.title}>
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <button
            type="button"
            onClick={previousStep}
            disabled={isFirstStep || isLoading}
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium',
              'border hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px]'
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            {labels.previous}
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px]'
            )}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Chargement...
              </>
            ) : (
              <>
                {isLastStep ? labels.complete : labels.next}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />}
              </>
            )}
          </button>
        </div>
      </div>
    </WizardContext.Provider>
  )
}

export default FormWizard
