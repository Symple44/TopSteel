'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus, AlertTriangle } from 'lucide-react'

interface OrdreMateriauxTabProps {
  ordreId?: string
}

export function OrdreMateriauxTab({ ordreId }: OrdreMateriauxTabProps) {
  const materiaux = [
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
    },
    {
      id: 3,
      reference: 'ALU-6060-PROF',
      designation: 'Aluminium 6060 - Profilé',
      quantiteRequise: 25,
      quantiteStock: 30,
      unite: 'ml',
      statut: 'DISPONIBLE'
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

  const getStatutColor = (statut: string) => {
    return statut === 'INSUFFISANT' ? 'text-red-600' : 'text-green-600'
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
                    <div className="font-medium">{materiau.reference}</div>
                    <div className="text-sm text-muted-foreground">{materiau.designation}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">
                    Requis: {materiau.quantiteRequise} {materiau.unite}
                  </div>
                  <div className={`text-sm font-medium ${getStatutColor(materiau.statut)}`}>
                    Stock: {materiau.quantiteStock} {materiau.unite}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {materiau.statut === 'INSUFFISANT' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {getStatutBadge(materiau.statut)}
                </div>
              </div>
              
              {materiau.statut === 'INSUFFISANT' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Manque {materiau.quantiteRequise - materiau.quantiteStock} {materiau.unite}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300">
                      Commander maintenant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {materiaux.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Aucun matériau défini</p>
          <p className="text-sm">Ajoutez des matériaux à cet ordre de fabrication</p>
        </div>
      )}
    </div>
  )
}
