'use client'

interface ClientStatusBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function ClientStatusBadge({ className, children }: ClientStatusBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge statut client component */}
      <p className="text-muted-foreground">Badge statut client component - Implementation needed</p>
      {children}
    </div>
  )
}
