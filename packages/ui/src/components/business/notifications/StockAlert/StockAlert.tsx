'use client'

interface StockAlertProps {
  className?: string
  children?: React.ReactNode
}

export function StockAlert({ className, children }: StockAlertProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Alerte stock component */}
      <p className="text-muted-foreground">
        Alerte stock component - Implementation needed
      </p>
      {children}
    </div>
  )
}
