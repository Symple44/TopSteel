'use client'

interface DateRangeFilterProps {
  className?: string
  children?: React.ReactNode
}

export function DateRangeFilter({ className, children }: DateRangeFilterProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Filtre période component */}
      <p className="text-muted-foreground">
        Filtre période component - Implementation needed
      </p>
      {children}
    </div>
  )
}
