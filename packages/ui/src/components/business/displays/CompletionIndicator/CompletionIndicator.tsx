'use client'

interface CompletionIndicatorProps {
  className?: string
  children?: React.ReactNode
}

export function CompletionIndicator({ className, children }: CompletionIndicatorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Indicateur completion component */}
      <p className="text-muted-foreground">
        Indicateur completion component - Implementation needed
      </p>
      {children}
    </div>
  )
}
