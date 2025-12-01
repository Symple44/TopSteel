'use client'

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp/ui'
import { Filter, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderColumn, QueryBuilderData } from '../../../../../types/query-builder.types'

interface FiltersTabProps {
  columns: QueryBuilderColumn[]
  queryBuilder: QueryBuilderData
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

interface FilterCondition {
  id: string
  column: string
  operator: string
  value: string
  logic: 'AND' | 'OR'
}

const OPERATORS = [
  { value: 'eq', label: '= Égal' },
  { value: 'neq', label: '≠ Différent' },
  { value: 'gt', label: '> Supérieur' },
  { value: 'gte', label: '≥ Supérieur ou égal' },
  { value: 'lt', label: '< Inférieur' },
  { value: 'lte', label: '≤ Inférieur ou égal' },
  { value: 'like', label: '∼ Contient' },
  { value: 'starts', label: 'Commence par' },
  { value: 'ends', label: 'Termine par' },
  { value: 'null', label: 'Est vide' },
  { value: 'notnull', label: 'N\'est pas vide' },
]

export function FiltersTab({ columns, queryBuilder, onSettingsChange }: FiltersTabProps) {
  const [filters, setFilters] = useState<FilterCondition[]>([])

  const handleAddFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      column: columns[0]?.columnName || '',
      operator: 'eq',
      value: '',
      logic: 'AND',
    }
    setFilters([...filters, newFilter])
  }

  const handleUpdateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id))
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune colonne disponible</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sélectionnez d'abord des colonnes pour pouvoir créer des filtres.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Filtres ({filters.length})
        </h3>
        <Button size="sm" variant="outline" onClick={handleAddFilter}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un filtre
        </Button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun filtre configuré</p>
          <p className="text-xs mt-1">Les filtres permettent de restreindre les résultats</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div key={filter.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
              {index > 0 && (
                <Select
                  value={filter.logic}
                  onValueChange={(v) => handleUpdateFilter(filter.id, { logic: v as 'AND' | 'OR' })}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">ET</SelectItem>
                    <SelectItem value="OR">OU</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select
                value={filter.column}
                onValueChange={(v) => handleUpdateFilter(filter.id, { column: v })}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Colonne" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.columnName} value={col.columnName}>
                      {col.label || col.columnName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(v) => handleUpdateFilter(filter.id, { operator: v })}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!['null', 'notnull'].includes(filter.operator) && (
                <Input
                  value={filter.value}
                  onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                  placeholder="Valeur"
                  className="flex-1 h-8"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={() => handleRemoveFilter(filter.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
