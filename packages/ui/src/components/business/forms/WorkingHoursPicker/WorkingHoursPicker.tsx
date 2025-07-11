'use client'

interface WorkingHoursPickerProps {
  className?: string
  children?: React.ReactNode
}

export function WorkingHoursPicker({ className, children }: WorkingHoursPickerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur heures component */}
      <p className="text-muted-foreground">Sélecteur heures component - Implementation needed</p>
      {children}
    </div>
  )
}
