'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Package, Plus } from 'lucide-react'

// Interface pour les matériaux
interface Materiau {
  id: number
  reference: string
  designation: string
  quantiteRequise: number
  quantiteStock: number
  unite: string
  statut: string
}

interface OrdreMateriauxTabProps {
  ordre: any; // Interface cohérente avec les autres composants
}

export function OrdreMateriauxTab({ ordre }: OrdreMateriauxTabProps) {
  const materiaux: Materiau[] = ordre?.materiaux || [
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
        {materiaux.map((materiau: Materiau) => (
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
              
              {materiau.statut === 'INSUFFISANT' && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Stock insuffisant</p>
                    <p className="text-xs text-red-600">
                      Manque: {materiau.quantiteRequise - materiau.quantiteStock} {materiau.unite}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {materiaux.some(m => m.statut === 'INSUFFISANT') && (
        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Action requise</p>
                <p className="text-sm">Certains matériaux ne sont pas disponibles en quantité suffisante.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Générer commande
              </Button>
              <Button variant="outline" size="sm">
                Vérifier alternatives
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}