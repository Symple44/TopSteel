'use client'

interface ClientSearchProps {
  className?: string
  children?: React.ReactNode
}

export function ClientSearch({ className, children }: ClientSearchProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Recherche clients component */}
      <p className="text-muted-foreground">Recherche clients component - Implementation needed</p>
      {children}
    </div>
  )
}
