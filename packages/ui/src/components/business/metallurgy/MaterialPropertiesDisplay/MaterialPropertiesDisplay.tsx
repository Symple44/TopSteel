'use client'

interface MaterialPropertiesDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialPropertiesDisplay({ className, children }: MaterialPropertiesDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Propriétés matériau component */}
      <p className="text-muted-foreground">
        Propriétés matériau component - Implementation needed
      </p>
      {children}
    </div>
  )
}
