// apps/web/src/components/facturation/factures-filters.tsx
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
import { Filter, Search, X } from 'lucide-react'

interface FacturesFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function FacturesFilters({ onFiltersChange }: FacturesFiltersProps) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Rechercher par référence, client..." className="pl-10" />
        </div>
      </div>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="brouillon">Brouillon</SelectItem>
          <SelectItem value="envoye">Envoyée</SelectItem>
          <SelectItem value="payee">Payée</SelectItem>
          <SelectItem value="en_retard">En retard</SelectItem>
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
