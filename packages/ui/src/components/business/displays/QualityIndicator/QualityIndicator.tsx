'use client'

interface QualityIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function QualityIndicator({ className, children }: QualityIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur qualité component */}
      <p className="text-muted-foreground">Indicateur qualité component - Implementation needed</p>
      {children}
    </div>
  )
}
