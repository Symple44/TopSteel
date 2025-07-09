'use client'

interface StockLevelIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function StockLevelIndicator({ className, children }: StockLevelIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur niveau stock component */}
      <p className="text-muted-foreground">
        Indicateur niveau stock component - Implementation needed
      </p>
      {children}
    </div>
  )
}
