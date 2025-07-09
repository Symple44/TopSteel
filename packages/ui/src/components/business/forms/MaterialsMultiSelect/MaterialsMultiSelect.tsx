'use client'

interface MaterialsMultiSelectProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialsMultiSelect({ className, children }: MaterialsMultiSelectProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Multi-sélecteur matériaux component */}
      <p className="text-muted-foreground">
        Multi-sélecteur matériaux component - Implementation needed
      </p>
      {children}
    </div>
  )
}
