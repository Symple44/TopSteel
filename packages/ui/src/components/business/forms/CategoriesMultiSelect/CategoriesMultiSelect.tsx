'use client'

interface CategoriesMultiSelectProps {
  className?: string
  children?: React.ReactNode
}

export function CategoriesMultiSelect({ className, children }: CategoriesMultiSelectProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Multi-sélecteur catégories component */}
      <p className="text-muted-foreground">
        Multi-sélecteur catégories component - Implementation needed
      </p>
      {children}
    </div>
  )
}
