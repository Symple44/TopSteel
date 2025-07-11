'use client'

interface StockStatusBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function StockStatusBadge({ className, children }: StockStatusBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge statut stock component */}
      <p className="text-muted-foreground">Badge statut stock component - Implementation needed</p>
      {children}
    </div>
  )
}
