'use client'

interface EmployeeSelectorProps {
  className?: string
  children?: React.ReactNode
}

export function EmployeeSelector({ className, children }: EmployeeSelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur employé component */}
      <p className="text-muted-foreground">Sélecteur employé component - Implementation needed</p>
      {children}
    </div>
  )
}
