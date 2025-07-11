'use client'

import { Card, CardContent, CardHeader, CardTitle, Input } from '@erp/ui'

import { ArrowLeft, ArrowRight, Calendar, Package, RotateCcw, Search, User } from 'lucide-react'
import { useState } from 'react'

interface Mouvement {
  id: string
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT'
  materiau: string
  quantite: number
  unite: string
  prixUnitaire?: number
  motif: string
  reference?: string
  emplacementSource?: string
  emplacementDestination?: string
  utilisateur: string
  dateCreation: Date
  notes?: string
}

interface MouvementsTableProps {
  type?: string
  mouvements?: Mouvement[]
  onSearch?: (query: string) => void
  onFilter?: (filters: unknown) => void
}

export function MouvementsTable({
  type,
  mouvements = [],
  onSearch,
  onFilter,
}: MouvementsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Mock data si aucune donnée fournie
  const mockMovements: Mouvement[] = [
    {
      id: 'mov-001',
      type: 'ENTREE',
      materiau: 'Acier inoxydable 304',
      quantite: 500,
      unite: 'kg',
      prixUnitaire: 8.5,
      motif: 'Réapprovisionnement',
      reference: 'BL-2024-001',
      utilisateur: 'Marie Dupont',
      dateCreation: new Date('2024-06-15'),
      notes: 'Qualité contrôlée',
    },
    {
      id: 'mov-002',
      type: 'SORTIE',
      materiau: 'Tubes acier Ø50',
      quantite: 25,
      unite: 'ml',
      prixUnitaire: 12.3,
      motif: 'Production projet ABC',
      reference: 'PRO-2024-001',
      utilisateur: 'Jean Martin',
      dateCreation: new Date('2024-06-14'),
      notes: 'Découpe précise',
    },
    {
      id: 'mov-003',
      type: 'TRANSFERT',
      materiau: 'Plaque aluminium 2mm',
      quantite: 10,
      unite: 'm²',
      motif: 'Réorganisation stock',
      emplacementSource: 'Zone A-01',
      emplacementDestination: 'Zone B-03',
      utilisateur: 'Sophie Durand',
      dateCreation: new Date('2024-06-13'),
      notes: 'Optimisation espace',
    },
    {
      id: 'mov-004',
      type: 'AJUSTEMENT',
      materiau: 'Cornières 40x40',
      quantite: -2,
      unite: 'pièce',
      motif: 'Correction inventaire',
      reference: 'INV-2024-06',
      utilisateur: 'Marc Rousseau',
      dateCreation: new Date('2024-06-12'),
      notes: 'Écart détecté',
    },
  ]

  const displayMovements = mouvements.length > 0 ? mouvements : mockMovements

  const filteredMovements =
    type && type !== 'tous'
      ? displayMovements.filter((m) => {
          // Normaliser la comparaison pour les types
          const typeMapping: Record<string, string> = {
            entrees: 'ENTREE',
            sorties: 'SORTIE',
            transferts: 'TRANSFERT',
            ajustements: 'AJUSTEMENT',
          }

          const targetType = typeMapping[type.toLowerCase()] || type.toUpperCase()

          return m.type === targetType
        })
      : displayMovements

  const getTypeBadge = (type: string) => {
    const config = {
      ENTREE: {
        label: 'Entrée',
        icon: ArrowRight,
        className: 'bg-green-100 text-green-800',
      },
      SORTIE: {
        label: 'Sortie',
        icon: ArrowLeft,
        className: 'bg-red-100 text-red-800',
      },
      TRANSFERT: {
        label: 'Transfert',
        icon: RotateCcw,
        className: 'bg-blue-100 text-blue-800',
      },
      AJUSTEMENT: {
        label: 'Ajustement',
        icon: Package,
        className: 'bg-purple-100 text-purple-800',
      },
    }

    const {
      label,
      icon: Icon,
      className,
    } = config[type as keyof typeof config] || config.AJUSTEMENT

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </span>
    )
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mouvements{type && type !== 'tous' ? ` - ${type}` : ''}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredMovements.length} mouvement(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par matériau, référence, utilisateur..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Matériau</th>
                <th className="text-left p-3">Quantité</th>
                <th className="text-left p-3">Prix unitaire</th>
                <th className="text-left p-3">Motif</th>
                <th className="text-left p-3">Référence</th>
                <th className="text-left p-3">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((mouvement) => (
                  <tr key={mouvement.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(mouvement.dateCreation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(mouvement.dateCreation).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{getTypeBadge(mouvement.type)}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{mouvement.materiau}</div>
                        {mouvement.type === 'TRANSFERT' &&
                          mouvement.emplacementSource &&
                          mouvement.emplacementDestination && (
                            <div className="text-xs text-muted-foreground">
                              {mouvement.emplacementSource} → {mouvement.emplacementDestination}
                            </div>
                          )}
                        {mouvement.notes && (
                          <div
                            className="text-xs text-muted-foreground mt-1"
                            title={mouvement.notes}
                          >
                            {mouvement.notes.length > 30
                              ? `${mouvement.notes.substring(0, 30)}...`
                              : mouvement.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-mono ${mouvement.quantite < 0 ? 'text-red-600' : ''}`}>
                        {mouvement.quantite > 0 ? '+' : ''}
                        {mouvement.quantite} {mouvement.unite}
                      </span>
                    </td>
                    <td className="p-3">
                      {mouvement.prixUnitaire && (
                        <span className="font-mono">{mouvement.prixUnitaire.toFixed(2)} €</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate" title={mouvement.motif}>
                        {mouvement.motif}
                      </div>
                    </td>
                    <td className="p-3">
                      {mouvement.reference && (
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {mouvement.reference}
                        </code>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{mouvement.utilisateur}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-50" />
                      <p>Aucun mouvement trouvé</p>
                      <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

