'use client'

interface TaskPriorityBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function TaskPriorityBadge({ className, children }: TaskPriorityBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge priorité tâche component */}
      <p className="text-muted-foreground">
        Badge priorité tâche component - Implementation needed
      </p>
      {children}
    </div>
  )
}
