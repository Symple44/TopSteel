'use client'

interface ProjectStatusBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function ProjectStatusBadge({ className, children }: ProjectStatusBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge statut projet component */}
      <p className="text-muted-foreground">
        Badge statut projet component - Implementation needed
      </p>
      {children}
    </div>
  )
}
