'use client'

interface GlobalSearchProps {
  className?: string
  children?: React.ReactNode
}

export function GlobalSearch({ className, children }: GlobalSearchProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Recherche globale component */}
      <p className="text-muted-foreground">Recherche globale component - Implementation needed</p>
      {children}
    </div>
  )
}
