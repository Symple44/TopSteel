'use client'

interface CuttingOptimizerProps {
  className?: string
  children?: React.ReactNode
}

export function CuttingOptimizer({ className, children }: CuttingOptimizerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Optimiseur découpe component */}
      <p className="text-muted-foreground">Optimiseur découpe component - Implementation needed</p>
      {children}
    </div>
  )
}
