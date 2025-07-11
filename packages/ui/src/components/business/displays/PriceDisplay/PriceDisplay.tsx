'use client'

interface PriceDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function PriceDisplay({ className, children }: PriceDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Affichage prix component */}
      <p className="text-muted-foreground">Affichage prix component - Implementation needed</p>
      {children}
    </div>
  )
}
