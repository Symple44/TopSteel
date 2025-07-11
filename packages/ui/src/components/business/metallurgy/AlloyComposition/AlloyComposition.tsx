'use client'

interface AlloyCompositionProps {
  className?: string
  children?: React.ReactNode
}

export function AlloyComposition({ className, children }: AlloyCompositionProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Composition alliage component */}
      <p className="text-muted-foreground">Composition alliage component - Implementation needed</p>
      {children}
    </div>
  )
}
