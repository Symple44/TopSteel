'use client'

interface InventoryChartProps {
  className?: string
  children?: React.ReactNode
}

export function InventoryChart({ className, children }: InventoryChartProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Graphique inventaire component */}
      <p className="text-muted-foreground">
        Graphique inventaire component - Implementation needed
      </p>
      {children}
    </div>
  )
}
