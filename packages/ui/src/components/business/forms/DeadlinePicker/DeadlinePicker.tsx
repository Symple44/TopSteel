'use client'

interface DeadlinePickerProps {
  className?: string
  children?: React.ReactNode
}

export function DeadlinePicker({ className, children }: DeadlinePickerProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur deadline component */}
      <p className="text-muted-foreground">Sélecteur deadline component - Implementation needed</p>
      {children}
    </div>
  )
}
