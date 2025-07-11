'use client'

interface ProfitMarginDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function ProfitMarginDisplay({ className, children }: ProfitMarginDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Affichage marge component */}
      <p className="text-muted-foreground">Affichage marge component - Implementation needed</p>
      {children}
    </div>
  )
}
