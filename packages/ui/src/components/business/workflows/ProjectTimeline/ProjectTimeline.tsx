'use client'

interface ProjectTimelineProps {
  className?: string
  children?: React.ReactNode
}

export function ProjectTimeline({ className, children }: ProjectTimelineProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Timeline projet component */}
      <p className="text-muted-foreground">Timeline projet component - Implementation needed</p>
      {children}
    </div>
  )
}
