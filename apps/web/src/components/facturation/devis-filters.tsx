// apps/web/src/components/facturation/devis-filters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

interface DevisFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function DevisFilters({ onFiltersChange }: DevisFiltersProps) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par référence, client..."
            className="pl-10"
          />
        </div>
      </div>
      
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="brouillon">Brouillon</SelectItem>
          <SelectItem value="envoye">Envoyé</SelectItem>
          <SelectItem value="accepte">Accepté</SelectItem>
          <SelectItem value="refuse">Refusé</SelectItem>
        </SelectContent>
      </Select>
      
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Toutes les périodes</SelectItem>
          <SelectItem value="7j">7 derniers jours</SelectItem>
          <SelectItem value="30j">30 derniers jours</SelectItem>
          <SelectItem value="3m">3 derniers mois</SelectItem>
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filtres
      </Button>
      
      <Button variant="outline" size="sm">
        <X className="h-4 w-4 mr-2" />
        Effacer
      </Button>
    </div>
  )
}
