'use client'

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp/ui'
import { ArrowDownAZ, ArrowUpAZ, Plus, SortAsc, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderColumn, QueryBuilderData } from '../../../../../types/query-builder.types'

interface SortTabProps {
  columns: QueryBuilderColumn[]
  queryBuilder: QueryBuilderData
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

interface SortItem {
  id: string
  column: string
  direction: 'ASC' | 'DESC'
  priority: number
}

export function SortTab({ columns, queryBuilder, onSettingsChange }: SortTabProps) {
  const [sortItems, setSortItems] = useState<SortItem[]>([])

  const handleAddSort = () => {
    const newSort: SortItem = {
      id: `sort_${Date.now()}`,
      column: columns[0]?.columnName || '',
      direction: 'ASC',
      priority: sortItems.length,
    }
    setSortItems([...sortItems, newSort])
  }

  const handleUpdateSort = (id: string, updates: Partial<SortItem>) => {
    setSortItems(sortItems.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const handleRemoveSort = (id: string) => {
    setSortItems(sortItems.filter((s) => s.id !== id))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...sortItems]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    setSortItems(newItems.map((item, idx) => ({ ...item, priority: idx })))
  }

  const handleMoveDown = (index: number) => {
    if (index === sortItems.length - 1) return
    const newItems = [...sortItems]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    setSortItems(newItems.map((item, idx) => ({ ...item, priority: idx })))
  }

  // Get available columns (not already used in sort)
  const getAvailableColumns = (currentSortId: string) => {
    const usedColumns = sortItems.filter((s) => s.id !== currentSortId).map((s) => s.column)
    return columns.filter((c) => !usedColumns.includes(c.columnName))
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <SortAsc className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune colonne disponible</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sélectionnez d'abord des colonnes pour pouvoir configurer le tri.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Ordre de tri ({sortItems.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddSort}
          disabled={sortItems.length >= columns.length}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un tri
        </Button>
      </div>

      {sortItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
          <SortAsc className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun tri configuré</p>
          <p className="text-xs mt-1">Les données seront affichées dans l'ordre par défaut</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
              <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>

              <Select
                value={item.column}
                onValueChange={(v) => handleUpdateSort(item.id, { column: v })}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Colonne" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableColumns(item.id).map((col) => (
                    <SelectItem key={col.columnName} value={col.columnName}>
                      {col.label || col.columnName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={item.direction === 'ASC' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 rounded-r-none"
                  onClick={() => handleUpdateSort(item.id, { direction: 'ASC' })}
                  title="Croissant (A-Z)"
                >
                  <ArrowUpAZ className="h-4 w-4" />
                </Button>
                <Button
                  variant={item.direction === 'DESC' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 rounded-l-none"
                  onClick={() => handleUpdateSort(item.id, { direction: 'DESC' })}
                  title="Décroissant (Z-A)"
                >
                  <ArrowDownAZ className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Monter"
                >
                  <span className="text-xs">↑</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === sortItems.length - 1}
                  title="Descendre"
                >
                  <span className="text-xs">↓</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={() => handleRemoveSort(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {sortItems.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">Ordre de priorité</p>
          <p>Le tri s'applique dans l'ordre affiché. Le premier élément a la priorité la plus haute.</p>
        </div>
      )}
    </div>
  )
}
