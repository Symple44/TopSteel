'use client'

interface TrendIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function TrendIndicator({ className, children }: TrendIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur tendance component */}
      <p className="text-muted-foreground">
        Indicateur tendance component - Implementation needed
      </p>
      {children}
    </div>
  )
}
