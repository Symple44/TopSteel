'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus, AlertTriangle } from 'lucide-react'

interface OrdreMateriauxTabProps {
  ordre: any; // Interface cohérente avec les autres composants
}

export function OrdreMateriauxTab({ ordre }: OrdreMateriauxTabProps) {
  const materiaux = ordre?.materiaux || [
    {
      id: 1,
      reference: 'ACIER-S235-02',
      designation: 'Acier S235 - Tôle 2mm',
      quantiteRequise: 50,
      quantiteStock: 45,
      unite: 'kg',
      statut: 'DISPONIBLE'
    },
    {
      id: 2,
      reference: 'INOX-304-TUBE',
      designation: 'Inox 304 - Tube rond Ø30',
      quantiteRequise: 12,
      quantiteStock: 8,
      unite: 'ml',
      statut: 'INSUFFISANT'
    }
  ]

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'DISPONIBLE':
        return <Badge variant="outline" className="text-green-600 border-green-600">Disponible</Badge>
      case 'INSUFFISANT':
        return <Badge variant="destructive">Insuffisant</Badge>
      case 'COMMANDE':
        return <Badge variant="secondary">En commande</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Matériaux requis</h3>
          <p className="text-sm text-muted-foreground">
            Liste des matériaux nécessaires pour cet ordre de fabrication
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter matériau
        </Button>
      </div>

      <div className="space-y-4">
        {materiaux.map((materiau) => (
          <Card key={materiau.id} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${materiau.statut === 'INSUFFISANT' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Package className={`h-5 w-5 ${materiau.statut === 'INSUFFISANT' ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{materiau.designation}</h4>
                    <p className="text-sm text-muted-foreground">{materiau.reference}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {materiau.quantiteRequise} {materiau.unite}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {materiau.quantiteStock} {materiau.unite}
                    </p>
                  </div>
                  {getStatutBadge(materiau.statut)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
