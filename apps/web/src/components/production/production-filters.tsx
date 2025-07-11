'use client'



import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'

import { Filter, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'

interface ProductionFiltersProps {
  onFiltersChange?: (filters: ProductionFilters) => void
  onReset?: () => void
}

interface ProductionFilters {
  search?: string
  statut?: string
  priorite?: string
  dateDebut?: string
  dateFin?: string
  responsable?: string
}

export function ProductionFilters({ onFiltersChange, onReset }: ProductionFiltersProps) {
  const [filters, setFilters] = useState<ProductionFilters>({})

  // ✅ Handler unique et cohérent
  const handleFilterChange = (key: keyof ProductionFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  // ✅ Handler pour les inputs (simplifié)
  const handleInputChange =
    (key: keyof ProductionFilters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange(key, e.target.value)
    }

  // ✅ Reset corrigé (sans accolade orpheline)
  const handleReset = () => {
    setFilters({})
    onFiltersChange?.({})
    onReset?.()
  }

  // ✅ Compteur de filtres actifs
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ''
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres de production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ✅ Recherche ajoutée */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par numéro, description..."
              value={filters.search || ''}
              onChange={handleInputChange('search')}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ✅ Statut ajouté */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut</Label>
            <Select
              value={filters.statut || ''}
              onValueChange={(value) => handleFilterChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="PLANIFIE">📋 Planifié</SelectItem>
                <SelectItem value="EN_COURS">⚙️ En cours</SelectItem>
                <SelectItem value="EN_ATTENTE">⏸️ En attente</SelectItem>
                <SelectItem value="TERMINE">✅ Terminé</SelectItem>
                <SelectItem value="ANNULE">❌ Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Priorité (corrigé le label) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priorité</Label>
            <Select
              value={filters.priorite || ''}
              onValueChange={(value) => handleFilterChange('priorite', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les priorités</SelectItem>
                <SelectItem value="BASSE">🟢 Basse</SelectItem>
                <SelectItem value="NORMALE">🟡 Normale</SelectItem>
                <SelectItem value="HAUTE">🟠 Haute</SelectItem>
                <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Responsable ajouté */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Responsable</Label>
            <Select
              value={filters.responsable || ''}
              onValueChange={(value) => handleFilterChange('responsable', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les responsables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les responsables</SelectItem>
                <SelectItem value="jean.martin">👨‍🔧 Jean Martin</SelectItem>
                <SelectItem value="marie.dupont">👩‍🔧 Marie Dupont</SelectItem>
                <SelectItem value="pierre.bernard">👨‍🔧 Pierre Bernard</SelectItem>
                <SelectItem value="sophie.moreau">👩‍🔧 Sophie Moreau</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ✅ Dates (handlers cohérents) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date début</Label>
            <Input
              type="date"
              value={filters.dateDebut || ''}
              onChange={handleInputChange('dateDebut')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date fin</Label>
            <Input
              type="date"
              value={filters.dateFin || ''}
              onChange={handleInputChange('dateFin')}
            />
          </div>
        </div>

        {/* ✅ Actions avec compteur amélioré */}
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={handleReset} disabled={activeFiltersCount === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="text-sm text-muted-foreground">
            {activeFiltersCount > 0 ? `${activeFiltersCount} filtre(s) actif(s)` : 'Aucun filtre'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ✅ BONUS: Version avec validation de dates
export function ProductionFiltersAdvanced({ onFiltersChange, onReset }: ProductionFiltersProps) {
  const [filters, setFilters] = useState<ProductionFilters>({})
  const [dateError, setDateError] = useState<string>('')

  const handleFilterChange = (key: keyof ProductionFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }

    // ✅ Validation des dates
    if (key === 'dateDebut' || key === 'dateFin') {
      const debut = key === 'dateDebut' ? value : newFilters.dateDebut
      const fin = key === 'dateFin' ? value : newFilters.dateFin

      if (debut && fin && new Date(debut) > new Date(fin)) {
        setDateError('La date de début ne peut pas être postérieure à la date de fin')
        return
      }
      setDateError('')
    }

    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleInputChange =
    (key: keyof ProductionFilters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange(key, e.target.value)
    }

  const handleReset = () => {
    setFilters({})
    setDateError('')
    onFiltersChange?.({})
    onReset?.()
  }

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ''
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de production
          </div>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recherche avec icône */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par numéro d'ordre, description, projet..."
              value={filters.search || ''}
              onChange={handleInputChange('search')}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtres en grille */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut</Label>
            <Select
              value={filters.statut || ''}
              onValueChange={(value) => handleFilterChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="PLANIFIE">📋 Planifié</SelectItem>
                <SelectItem value="EN_COURS">⚙️ En cours</SelectItem>
                <SelectItem value="EN_ATTENTE">⏸️ En attente</SelectItem>
                <SelectItem value="TERMINE">✅ Terminé</SelectItem>
                <SelectItem value="ANNULE">❌ Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Priorité</Label>
            <Select
              value={filters.priorite || ''}
              onValueChange={(value) => handleFilterChange('priorite', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les priorités</SelectItem>
                <SelectItem value="BASSE">🟢 Basse</SelectItem>
                <SelectItem value="NORMALE">🟡 Normale</SelectItem>
                <SelectItem value="HAUTE">🟠 Haute</SelectItem>
                <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Responsable</Label>
            <Select
              value={filters.responsable || ''}
              onValueChange={(value) => handleFilterChange('responsable', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les responsables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les responsables</SelectItem>
                <SelectItem value="jean.martin">👨‍🔧 Jean Martin</SelectItem>
                <SelectItem value="marie.dupont">👩‍🔧 Marie Dupont</SelectItem>
                <SelectItem value="pierre.bernard">👨‍🔧 Pierre Bernard</SelectItem>
                <SelectItem value="sophie.moreau">👩‍🔧 Sophie Moreau</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dates avec validation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date début</Label>
            <Input
              type="date"
              value={filters.dateDebut || ''}
              onChange={handleInputChange('dateDebut')}
              className={dateError ? 'border-red-500' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date fin</Label>
            <Input
              type="date"
              value={filters.dateFin || ''}
              onChange={handleInputChange('dateFin')}
              className={dateError ? 'border-red-500' : ''}
            />
          </div>
        </div>

        {/* Message d'erreur pour les dates */}
        {dateError && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md flex items-center gap-2">
            <span>⚠️</span>
            {dateError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={handleReset} disabled={activeFiltersCount === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="text-sm text-muted-foreground">
            {activeFiltersCount > 0 ? `${activeFiltersCount} filtre(s) actif(s)` : 'Aucun filtre'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
