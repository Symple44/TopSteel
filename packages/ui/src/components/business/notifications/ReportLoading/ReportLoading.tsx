'use client'

interface ReportLoadingProps {
  className?: string
  children?: React.ReactNode
}

export function ReportLoading({ className, children }: ReportLoadingProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Chargement rapport component */}
      <p className="text-muted-foreground">Chargement rapport component - Implementation needed</p>
      {children}
    </div>
  )
}
