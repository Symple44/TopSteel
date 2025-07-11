'use client'

interface QualityControlChecklistProps {
  className?: string
  children?: React.ReactNode
}

export function QualityControlChecklist({ className, children }: QualityControlChecklistProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Checklist qualité component */}
      <p className="text-muted-foreground">Checklist qualité component - Implementation needed</p>
      {children}
    </div>
  )
}
