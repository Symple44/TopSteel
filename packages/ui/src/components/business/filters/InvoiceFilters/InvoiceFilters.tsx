'use client'

interface InvoiceFiltersProps {
  className?: string
  children?: React.ReactNode
}

export function InvoiceFilters({ className, children }: InvoiceFiltersProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Filtres factures component */}
      <p className="text-muted-foreground">Filtres factures component - Implementation needed</p>
      {children}
    </div>
  )
}
