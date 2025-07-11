'use client'

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'

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
        <button type="button" variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Catégorie</Label>
          <Select
            value={filters.categorie}
            onValueChange={(value) => handleFilterChange('categorie', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les catégories</SelectItem>
              <SelectItem value="acier">Acier</SelectItem>
              <SelectItem value="inox">Inoxydable</SelectItem>
              <SelectItem value="aluminium">Aluminium</SelectItem>
              <SelectItem value="cuivre">Cuivre</SelectItem>
              <SelectItem value="consommables">Consommables</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Emplacement</Label>
          <Select
            value={filters.emplacement}
            onValueChange={(value) => handleFilterChange('emplacement', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les emplacements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les emplacements</SelectItem>
              <SelectItem value="A">Zone A - Stockage principal</SelectItem>
              <SelectItem value="B">Zone B - Stockage secondaire</SelectItem>
              <SelectItem value="C">Zone C - Consommables</SelectItem>
              <SelectItem value="D">Zone D - Chutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Fournisseur</Label>
          <Select
            value={filters.fournisseur}
            onValueChange={(value) => handleFilterChange('fournisseur', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les fournisseurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les fournisseurs</SelectItem>
              <SelectItem value="arcelormittal">ArcelorMittal</SelectItem>
              <SelectItem value="aperam">Aperam</SelectItem>
              <SelectItem value="outokumpu">Outokumpu</SelectItem>
              <SelectItem value="local">Fournisseurs locaux</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Stock minimum</Label>
          <Input
            type="number"
            value={filters.stockMin}
            onChange={(e) => handleFilterChange('stockMin', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Stock maximum</Label>
          <Input
            type="number"
            value={filters.stockMax}
            onChange={(e) => handleFilterChange('stockMax', e.target.value)}
            placeholder="1000"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Statut</Label>
          <Select
            value={filters.statut}
            onValueChange={(value) => handleFilterChange('statut', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les statuts</SelectItem>
              <SelectItem value="normal">Stock normal</SelectItem>
              <SelectItem value="bas">Stock bas</SelectItem>
              <SelectItem value="critique">Stock critique</SelectItem>
              <SelectItem value="rupture">Rupture</SelectItem>
            </SelectContent>
          </Select>
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

