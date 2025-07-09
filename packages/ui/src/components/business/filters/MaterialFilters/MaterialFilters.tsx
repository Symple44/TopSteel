'use client'

interface MaterialFiltersProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialFilters({ className, children }: MaterialFiltersProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Filtres matériaux component */}
      <p className="text-muted-foreground">
        Filtres matériaux component - Implementation needed
      </p>
      {children}
    </div>
  )
}
