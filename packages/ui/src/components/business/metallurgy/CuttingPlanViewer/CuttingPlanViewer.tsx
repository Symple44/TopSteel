'use client'

interface CuttingPlanViewerProps {
  className?: string
  children?: React.ReactNode
}

export function CuttingPlanViewer({ className, children }: CuttingPlanViewerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Plan de coupe component */}
      <p className="text-muted-foreground">Plan de coupe component - Implementation needed</p>
      {children}
    </div>
  )
}
