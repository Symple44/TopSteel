'use client'

interface SupplierSelectorProps {
  className?: string
  children?: React.ReactNode
}

export function SupplierSelector({ className, children }: SupplierSelectorProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Sélecteur fournisseur component */}
      <p className="text-muted-foreground">
        Sélecteur fournisseur component - Implementation needed
      </p>
      {children}
    </div>
  )
}
