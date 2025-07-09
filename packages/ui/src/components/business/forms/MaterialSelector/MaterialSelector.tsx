'use client'

interface MaterialSelectorProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialSelector({ className, children }: MaterialSelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur matériau component */}
      <p className="text-muted-foreground">
        Sélecteur matériau component - Implementation needed
      </p>
      {children}
    </div>
  )
}
