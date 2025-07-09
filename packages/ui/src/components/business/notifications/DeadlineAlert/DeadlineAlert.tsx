'use client'

interface DeadlineAlertProps {
  className?: string
  children?: React.ReactNode
}

export function DeadlineAlert({ className, children }: DeadlineAlertProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Alerte deadline component */}
      <p className="text-muted-foreground">
        Alerte deadline component - Implementation needed
      </p>
      {children}
    </div>
  )
}
