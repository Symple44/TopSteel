'use client'

interface MechanicalPropertiesProps {
  className?: string
  children?: React.ReactNode
}

export function MechanicalProperties({ className, children }: MechanicalPropertiesProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Propriétés mécaniques component */}
      <p className="text-muted-foreground">
        Propriétés mécaniques component - Implementation needed
      </p>
      {children}
    </div>
  )
}
