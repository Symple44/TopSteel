'use client'

import { Badge } from '@erp/ui'
import { Button } from '@erp/ui'
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react'

export function StockAlertsPanel() {
  const alertes = [
    {
      id: 1,
      reference: 'ACIER-S235-02',
      designation: 'Acier S235 - Tôle 2mm',
      stockActuel: 5,
      seuil: 20,
      niveau: 'critique' as const,
    },
    {
      id: 2,
      reference: 'INOX-304-TUBE',
      designation: 'Inox 304 - Tube rond Ø30',
      stockActuel: 8,
      seuil: 15,
      niveau: 'bas' as const,
    },
    {
      id: 3,
      reference: 'ALU-6060-PROF',
      designation: 'Aluminium 6060 - Profilé',
      stockActuel: 2,
      seuil: 12,
      niveau: 'critique' as const,
    },
  ]

  return (
    <div className="space-y-3">
      {alertes.map((alerte) => (
        <div key={alerte.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${alerte.niveau === 'critique' ? 'bg-red-100' : 'bg-orange-100'}`}
            >
              <Package
                className={`h-4 w-4 ${alerte.niveau === 'critique' ? 'text-red-600' : 'text-orange-600'}`}
              />
            </div>
            <div>
              <div className="font-medium text-sm">{alerte.reference}</div>
              <div className="text-xs text-muted-foreground">{alerte.designation}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={alerte.niveau === 'critique' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alerte.stockActuel} restant
                </Badge>
                <span className="text-xs text-muted-foreground">Seuil: {alerte.seuil}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Commander
            </Button>
          </div>
        </div>
      ))}
      {alertes.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucune alerte de stock</p>
        </div>
      )}
    </div>
  )
}
