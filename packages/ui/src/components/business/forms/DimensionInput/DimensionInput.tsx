'use client'

interface DimensionInputProps {
  className?: string
  children?: React.ReactNode
}

export function DimensionInput({ className, children }: DimensionInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input dimensions component */}
      <p className="text-muted-foreground">Input dimensions component - Implementation needed</p>
      {children}
    </div>
  )
}
