'use client'

interface CostCalculatorProps {
  className?: string
  children?: React.ReactNode
}

export function CostCalculator({ className, children }: CostCalculatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Calculateur coût component */}
      <p className="text-muted-foreground">Calculateur coût component - Implementation needed</p>
      {children}
    </div>
  )
}
