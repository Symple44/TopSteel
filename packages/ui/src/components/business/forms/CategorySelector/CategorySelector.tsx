'use client'

interface CategorySelectorProps {
  className?: string
  children?: React.ReactNode
}

export function CategorySelector({ className, children }: CategorySelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur catégorie component */}
      <p className="text-muted-foreground">Sélecteur catégorie component - Implementation needed</p>
      {children}
    </div>
  )
}
