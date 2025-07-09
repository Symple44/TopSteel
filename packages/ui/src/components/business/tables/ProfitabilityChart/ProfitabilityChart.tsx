'use client'

interface ProfitabilityChartProps {
  className?: string
  children?: React.ReactNode
}

export function ProfitabilityChart({ className, children }: ProfitabilityChartProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Graphique rentabilité component */}
      <p className="text-muted-foreground">
        Graphique rentabilité component - Implementation needed
      </p>
      {children}
    </div>
  )
}
