'use client'

interface CurrencyDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function CurrencyDisplay({ className, children }: CurrencyDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Affichage devise component */}
      <p className="text-muted-foreground">
        Affichage devise component - Implementation needed
      </p>
      {children}
    </div>
  )
}
