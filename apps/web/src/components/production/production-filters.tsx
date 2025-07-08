// apps/web/src/components/production/production-filters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Filter, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'

interface ProductionFiltersProps {
  onFiltersChange?: (filters: ProductionFilters) => void // Props optionnelles
  onReset?: () => void // Props optionnelles
}

interface ProductionFilters {
  search?: string
  statut?: string[]
  priorite?: string[]
  dateDebut?: string
  dateFin?: string
  responsable?: string
}

export function ProductionFilters({ onFiltersChange, onReset }: ProductionFiltersProps) {
  const [filters, setFilters] = useState<ProductionFilters>({})

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }

    setFilters(newFilters)
    onFiltersChange?.(newFilters) // Safe call avec ?
  }

  const handleReset = () => {
    setFilters({})
    onReset?.() // Safe call avec ?
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres de production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Numéro, description..."
                className="pl-10"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <select
              className="w-full p-2 border rounded-md"
              value={filters.statut?.[0] || ''}
              onChange={(e) => handleFilterChange('statut', e.target.value ? [e.target.value] : [])}
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="PAUSE">Pause</option>
            </select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorité</label>
            <select
              className="w-full p-2 border rounded-md"
              value={filters.priorite?.[0] || ''}
              onChange={(e) =>
                handleFilterChange(
                  'priorite',
                  (e.target as HTMLSelectElement).value
                    ? [(e.target as HTMLSelectElement).value]
                    : []
                )
              }
            >
              <option value="">Toutes les priorités</option>
              <option value="BASSE">Basse</option>
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date début</label>
            <Input
              type="date"
              value={filters.dateDebut || ''}
              onChange={(e) =>
                handleFilterChange('dateDebut', (e.target as HTMLInputElement).value)
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date fin</label>
            <Input
              type="date"
              value={filters.dateFin || ''}
              onChange={(e) => handleFilterChange('dateFin', (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="text-sm text-muted-foreground">
            {Object.keys(filters).length > 0
              ? `${Object.keys(filters).length} filtre(s) actif(s)`
              : 'Aucun filtre'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
