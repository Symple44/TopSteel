'use client'

interface BusinessSortControlsProps {
  className?: string
  children?: React.ReactNode
}

export function BusinessSortControls({ className, children }: BusinessSortControlsProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Contrôles tri component */}
      <p className="text-muted-foreground">
        Contrôles tri component - Implementation needed
      </p>
      {children}
    </div>
  )
}
