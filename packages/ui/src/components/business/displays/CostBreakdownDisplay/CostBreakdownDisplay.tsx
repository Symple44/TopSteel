'use client'

interface CostBreakdownDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function CostBreakdownDisplay({ className, children }: CostBreakdownDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Détail des coûts component */}
      <p className="text-muted-foreground">Détail des coûts component - Implementation needed</p>
      {children}
    </div>
  )
}
