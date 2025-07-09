'use client'

interface ImportProgressProps {
  className?: string
  children?: React.ReactNode
}

export function ImportProgress({ className, children }: ImportProgressProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Progression import component */}
      <p className="text-muted-foreground">
        Progression import component - Implementation needed
      </p>
      {children}
    </div>
  )
}
