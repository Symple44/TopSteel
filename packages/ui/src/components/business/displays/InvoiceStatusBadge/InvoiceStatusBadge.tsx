'use client'

interface InvoiceStatusBadgeProps {
  className?: string
  children?: React.ReactNode
}

export function InvoiceStatusBadge({ className, children }: InvoiceStatusBadgeProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Badge statut facture component */}
      <p className="text-muted-foreground">
        Badge statut facture component - Implementation needed
      </p>
      {children}
    </div>
  )
}
