'use client'

interface SchedulePickerProps {
  className?: string
  children?: React.ReactNode
}

export function SchedulePicker({ className, children }: SchedulePickerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur planning component */}
      <p className="text-muted-foreground">
        Sélecteur planning component - Implementation needed
      </p>
      {children}
    </div>
  )
}
