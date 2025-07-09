'use client'

interface ClientFiltersProps {
  className?: string
  children?: React.ReactNode
}

export function ClientFilters({ className, children }: ClientFiltersProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Filtres clients component */}
      <p className="text-muted-foreground">
        Filtres clients component - Implementation needed
      </p>
      {children}
    </div>
  )
}
