'use client'

interface PerformanceGaugeProps {
  className?: string
  children?: React.ReactNode
}

export function PerformanceGauge({ className, children }: PerformanceGaugeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Jauge performance component */}
      <p className="text-muted-foreground">
        Jauge performance component - Implementation needed
      </p>
      {children}
    </div>
  )
}
