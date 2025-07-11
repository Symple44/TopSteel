'use client'

interface ProcessStepperProps {
  className?: string
  children?: React.ReactNode
}

export function ProcessStepper({ className, children }: ProcessStepperProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Étapes processus component */}
      <p className="text-muted-foreground">Étapes processus component - Implementation needed</p>
      {children}
    </div>
  )
}
