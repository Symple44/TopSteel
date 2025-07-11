'use client'

interface OrderProgressTrackerProps {
  className?: string
  children?: React.ReactNode
}

export function OrderProgressTracker({ className, children }: OrderProgressTrackerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Suivi commande component */}
      <p className="text-muted-foreground">Suivi commande component - Implementation needed</p>
      {children}
    </div>
  )
}
