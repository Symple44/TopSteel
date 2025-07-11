'use client'

interface DeadlineIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function DeadlineIndicator({ className, children }: DeadlineIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur deadline component */}
      <p className="text-muted-foreground">Indicateur deadline component - Implementation needed</p>
      {children}
    </div>
  )
}
