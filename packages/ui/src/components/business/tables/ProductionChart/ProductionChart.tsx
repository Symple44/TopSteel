'use client'

interface ProductionChartProps {
  className?: string
  children?: React.ReactNode
}

export function ProductionChart({ className, children }: ProductionChartProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Graphique production component */}
      <p className="text-muted-foreground">
        Graphique production component - Implementation needed
      </p>
      {children}
    </div>
  )
}
