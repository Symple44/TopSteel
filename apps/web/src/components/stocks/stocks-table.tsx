'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, MoreHorizontal, Package, Trash2 } from 'lucide-react'

export function StocksTable() {
  const _stocks = [
    {
      id: 1,
      reference: 'ACIER-S235-02',
      designation: 'Acier S235 - Tôle 2mm',
      quantite: 45,
      unite: 'kg',
      seuil: 20,
      emplacement: 'A1-B2-C3',
      prixUnitaire: 2.85,
      valeur: 128.25,
      statut: 'normal' as const,
      fournisseur: 'ArcelorMittal'
    },
    {
      id: 2,
      reference: 'INOX-304-TUBE',
      designation: 'Inox 304 - Tube rond Ø30',
      quantite: 8,
      unite: 'ml',
      seuil: 15,
      emplacement: 'B2-C1-D4',
      prixUnitaire: 45.20,
      valeur: 361.60,
      statut: 'bas' as const,
      fournisseur: 'Aperam'
    },
    {
      id: 3,
      reference: 'ALU-6060-PROF',
      designation: 'Aluminium 6060 - Profilé 40x40',
      quantite: 2,
      unite: 'ml',
      seuil: 12,
      emplacement: 'C1-D2-E1',
      prixUnitaire: 12.50,
      valeur: 25.00,
      statut: 'critique' as const,
      fournisseur: 'Local Alu'
    },
    {
      id: 4,
      reference: 'ACIER-S355-IPE',
      designation: 'Acier S355 - Poutre IPE 200',
      quantite: 125,
      unite: 'ml',
      seuil: 50,
      emplacement: 'A2-B1-C2',
      prixUnitaire: 15.80,
      valeur: 1975.00,
      statut: 'normal' as const,
      fournisseur: 'ArcelorMittal'
    }
  ]

  const _getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>
      case 'bas':
        return <Badge variant="secondary">Stock bas</Badge>
      case 'normal':
        return <Badge variant="outline">Normal</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Référence</th>
              <th className="text-left p-4 font-medium">Désignation</th>
              <th className="text-right p-4 font-medium">Stock</th>
              <th className="text-left p-4 font-medium">Emplacement</th>
              <th className="text-right p-4 font-medium">Prix unit.</th>
              <th className="text-right p-4 font-medium">Valeur</th>
              <th className="text-left p-4 font-medium">Statut</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => (
              <tr key={stock.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{stock.reference}</div>
                      <div className="text-xs text-muted-foreground">{stock.fournisseur}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="max-w-[300px]">
                    <div className="font-medium truncate">{stock.designation}</div>
                    <div className="text-xs text-muted-foreground">Seuil: {stock.seuil} {stock.unite}</div>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className={`font-medium ${stock.statut === 'critique' ? 'text-red-600' : stock.statut === 'bas' ? 'text-orange-600' : ''}`}>
                    {stock.quantite} {stock.unite}
                  </div>
                </td>
                <td className="p-4">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{stock.emplacement}</code>
                </td>
                <td className="p-4 text-right font-mono text-sm">
                  €{stock.prixUnitaire.toFixed(2)}
                </td>
                <td className="p-4 text-right font-medium">
                  €{stock.valeur.toFixed(2)}
                </td>
                <td className="p-4">
                  {getStatutBadge(stock.statut)}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {stocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun stock trouvé</p>
        </div>
      )}
    </div>
  )
}

