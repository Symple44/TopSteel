'use client'

interface TaxDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function TaxDisplay({ className, children }: TaxDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Affichage taxes component */}
      <p className="text-muted-foreground">Affichage taxes component - Implementation needed</p>
      {children}
    </div>
  )
}
