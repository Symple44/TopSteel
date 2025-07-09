'use client'

interface PaymentTimelineProps {
  className?: string
  children?: React.ReactNode
}

export function PaymentTimeline({ className, children }: PaymentTimelineProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Timeline paiement component */}
      <p className="text-muted-foreground">
        Timeline paiement component - Implementation needed
      </p>
      {children}
    </div>
  )
}
