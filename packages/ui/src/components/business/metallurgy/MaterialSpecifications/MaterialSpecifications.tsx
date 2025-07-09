'use client'

interface MaterialSpecificationsProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialSpecifications({ className, children }: MaterialSpecificationsProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Spécifications matériau component */}
      <p className="text-muted-foreground">
        Spécifications matériau component - Implementation needed
      </p>
      {children}
    </div>
  )
}
