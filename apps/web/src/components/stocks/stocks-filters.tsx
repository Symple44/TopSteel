'use client'

import { Button } from '@erp/ui'
import { Input } from '@erp/ui'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

interface StocksFiltersProps {
  onFiltersChange?: (filters: StocksFilters) => void
  onReset?: () => void
}

interface StocksFilters {
  categorie: string
  emplacement: string
  fournisseur: string
  stockMin: string
  stockMax: string
  statut: string
}

export function StocksFilters({ onFiltersChange, onReset }: StocksFiltersProps = {}) {
  const [filters, setFilters] = useState<StocksFilters>({
    categorie: '',
    emplacement: '',
    fournisseur: '',
    stockMin: '',
    stockMax: '',
    statut: '',
  })

  const handleFilterChange = (key: keyof StocksFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }

    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleReset = () => {
    const resetFilters: StocksFilters = {
      categorie: '',
      emplacement: '',
      fournisseur: '',
      stockMin: '',
      stockMax: '',
      statut: '',
    }

    setFilters(resetFilters)
    onFiltersChange?.(resetFilters)
    onReset?.()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtres avancés</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Catégorie</label>
          <select
            value={filters.categorie}
            onChange={(e) => handleFilterChange('categorie', (e.target as HTMLSelectElement).value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Toutes les catégories</option>
            <option value="acier">Acier</option>
            <option value="inox">Inoxydable</option>
            <option value="aluminium">Aluminium</option>
            <option value="cuivre">Cuivre</option>
            <option value="consommables">Consommables</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Emplacement</label>
          <select
            value={filters.emplacement}
            onChange={(e) =>
              handleFilterChange('emplacement', (e.target as HTMLSelectElement).value)
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">Tous les emplacements</option>
            <option value="A">Zone A - Stockage principal</option>
            <option value="B">Zone B - Stockage secondaire</option>
            <option value="C">Zone C - Consommables</option>
            <option value="D">Zone D - Chutes</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Fournisseur</label>
          <select
            value={filters.fournisseur}
            onChange={(e) =>
              handleFilterChange('fournisseur', (e.target as HTMLSelectElement).value)
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">Tous les fournisseurs</option>
            <option value="arcelormittal">ArcelorMittal</option>
            <option value="aperam">Aperam</option>
            <option value="outokumpu">Outokumpu</option>
            <option value="local">Fournisseurs locaux</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Stock minimum</label>
          <Input
            type="number"
            value={filters.stockMin}
            onChange={(e) => handleFilterChange('stockMin', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Stock maximum</label>
          <Input
            type="number"
            value={filters.stockMax}
            onChange={(e) => handleFilterChange('stockMax', e.target.value)}
            placeholder="1000"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Statut</label>
          <select
            value={filters.statut}
            onChange={(e) => handleFilterChange('statut', (e.target as HTMLSelectElement).value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="normal">Stock normal</option>
            <option value="bas">Stock bas</option>
            <option value="critique">Stock critique</option>
            <option value="rupture">Rupture</option>
          </select>
        </div>
      </div>

      {/* Affichage du nombre de filtres actifs */}
      <div className="text-sm text-muted-foreground">
        {Object.values(filters).filter(Boolean).length > 0
          ? `${Object.values(filters).filter(Boolean).length} filtre(s) actif(s)`
          : 'Aucun filtre actif'}
      </div>
    </div>
  )
}
