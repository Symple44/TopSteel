'use client'

interface MachineStatusDisplayProps {
  className?: string
  children?: React.ReactNode
}

export function MachineStatusDisplay({ className, children }: MachineStatusDisplayProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Statut machine component */}
      <p className="text-muted-foreground">Statut machine component - Implementation needed</p>
      {children}
    </div>
  )
}
