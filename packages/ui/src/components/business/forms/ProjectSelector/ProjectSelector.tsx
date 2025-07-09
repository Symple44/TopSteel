'use client'

interface ProjectSelectorProps {
  className?: string
  children?: React.ReactNode
}

export function ProjectSelector({ className, children }: ProjectSelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur projet component */}
      <p className="text-muted-foreground">
        Sélecteur projet component - Implementation needed
      </p>
      {children}
    </div>
  )
}
