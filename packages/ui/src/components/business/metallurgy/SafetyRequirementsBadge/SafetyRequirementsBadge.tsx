'use client'

interface SafetyRequirementsBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function SafetyRequirementsBadge({ className, children }: SafetyRequirementsBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge sécurité component */}
      <p className="text-muted-foreground">
        Badge sécurité component - Implementation needed
      </p>
      {children}
    </div>
  )
}
