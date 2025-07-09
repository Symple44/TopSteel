'use client'

interface HazardIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function HazardIndicator({ className, children }: HazardIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur danger component */}
      <p className="text-muted-foreground">
        Indicateur danger component - Implementation needed
      </p>
      {children}
    </div>
  )
}
