'use client'

interface VatInputProps {
  className?: string
  children?: React.ReactNode
}

export function VatInput({ className, children }: VatInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input TVA component */}
      <p className="text-muted-foreground">
        Input TVA component - Implementation needed
      </p>
      {children}
    </div>
  )
}
