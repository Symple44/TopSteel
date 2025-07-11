'use client'

interface ClientSelectorProps {
  className?: string
  children?: React.ReactNode
}

export function ClientSelector({ className, children }: ClientSelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur client component */}
      <p className="text-muted-foreground">Sélecteur client component - Implementation needed</p>
      {children}
    </div>
  )
}
