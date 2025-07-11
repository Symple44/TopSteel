'use client'

interface SalesChartProps {
  className?: string
  children?: React.ReactNode
}

export function SalesChart({ className, children }: SalesChartProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Graphique ventes component */}
      <p className="text-muted-foreground">Graphique ventes component - Implementation needed</p>
      {children}
    </div>
  )
}
