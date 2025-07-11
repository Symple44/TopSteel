'use client'

interface WeightCalculatorProps {
  className?: string
  children?: React.ReactNode
}

export function WeightCalculator({ className, children }: WeightCalculatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Calculateur poids component */}
      <p className="text-muted-foreground">Calculateur poids component - Implementation needed</p>
      {children}
    </div>
  )
}
