'use client'

interface TaskWorkflowProps {
  className?: string
  children?: React.ReactNode
}

export function TaskWorkflow({ className, children }: TaskWorkflowProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Workflow tâches component */}
      <p className="text-muted-foreground">Workflow tâches component - Implementation needed</p>
      {children}
    </div>
  )
}
