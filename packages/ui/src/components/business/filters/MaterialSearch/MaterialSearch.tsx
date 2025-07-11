'use client'

interface MaterialSearchProps {
  className?: string
  children?: React.ReactNode
}

export function MaterialSearch({ className, children }: MaterialSearchProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Recherche matériaux component */}
      <p className="text-muted-foreground">Recherche matériaux component - Implementation needed</p>
      {children}
    </div>
  )
}
