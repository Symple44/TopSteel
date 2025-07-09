'use client'

interface ProjectFiltersProps {
  className?: string
  children?: React.ReactNode
}

export function ProjectFilters({ className, children }: ProjectFiltersProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Filtres projets component */}
      <p className="text-muted-foreground">
        Filtres projets component - Implementation needed
      </p>
      {children}
    </div>
  )
}
