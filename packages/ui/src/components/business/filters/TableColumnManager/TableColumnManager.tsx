'use client'

interface TableColumnManagerProps {
  className?: string
  children?: React.ReactNode
}

export function TableColumnManager({ className, children }: TableColumnManagerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Gestionnaire colonnes component */}
      <p className="text-muted-foreground">
        Gestionnaire colonnes component - Implementation needed
      </p>
      {children}
    </div>
  )
}
