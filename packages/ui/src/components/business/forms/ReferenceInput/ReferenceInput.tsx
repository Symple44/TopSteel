'use client'

interface ReferenceInputProps {
  className?: string
  children?: React.ReactNode
}

export function ReferenceInput({ className, children }: ReferenceInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input référence component */}
      <p className="text-muted-foreground">
        Input référence component - Implementation needed
      </p>
      {children}
    </div>
  )
}
