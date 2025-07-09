'use client'

interface CertificationStatusProps {
  className?: string
  children?: React.ReactNode
}

export function CertificationStatus({ className, children }: CertificationStatusProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Statut certification component */}
      <p className="text-muted-foreground">
        Statut certification component - Implementation needed
      </p>
      {children}
    </div>
  )
}
