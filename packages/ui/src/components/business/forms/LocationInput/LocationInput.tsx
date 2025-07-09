'use client'

interface LocationInputProps {
  className?: string
  children?: React.ReactNode
}

export function LocationInput({ className, children }: LocationInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input localisation component */}
      <p className="text-muted-foreground">
        Input localisation component - Implementation needed
      </p>
      {children}
    </div>
  )
}
