'use client'

interface QualityAlertProps {
  className?: string
  children?: React.ReactNode
}

export function QualityAlert({ className, children }: QualityAlertProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Alerte qualité component */}
      <p className="text-muted-foreground">
        Alerte qualité component - Implementation needed
      </p>
      {children}
    </div>
  )
}
