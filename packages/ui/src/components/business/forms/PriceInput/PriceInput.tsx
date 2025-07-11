'use client'

interface PriceInputProps {
  className?: string
  children?: React.ReactNode
}

export function PriceInput({ className, children }: PriceInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input prix component */}
      <p className="text-muted-foreground">Input prix component - Implementation needed</p>
      {children}
    </div>
  )
}
