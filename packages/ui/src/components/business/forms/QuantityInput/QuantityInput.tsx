'use client'

interface QuantityInputProps {
  className?: string
  children?: React.ReactNode
}

export function QuantityInput({ className, children }: QuantityInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input quantité component */}
      <p className="text-muted-foreground">Input quantité component - Implementation needed</p>
      {children}
    </div>
  )
}
