'use client'

interface InvoiceGeneratingLoaderProps {
  className?: string
  children?: React.ReactNode
}

export function InvoiceGeneratingLoader({ className, children }: InvoiceGeneratingLoaderProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Chargement facture component */}
      <p className="text-muted-foreground">Chargement facture component - Implementation needed</p>
      {children}
    </div>
  )
}
