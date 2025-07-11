'use client'

interface PaymentAlertProps {
  className?: string
  children?: React.ReactNode
}

export function PaymentAlert({ className, children }: PaymentAlertProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Alerte paiement component */}
      <p className="text-muted-foreground">Alerte paiement component - Implementation needed</p>
      {children}
    </div>
  )
}
