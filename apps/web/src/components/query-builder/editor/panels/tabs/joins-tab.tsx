'use client'

import { Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp/ui'
import { Link2, Plus, Trash2 } from 'lucide-react'
import type { DatabaseTable, QueryBuilderJoin } from '../../../../../types/query-builder.types'

interface JoinsTabProps {
  joins: QueryBuilderJoin[]
  mainTable: string
  selectedTable?: DatabaseTable
  onChange: (joins: QueryBuilderJoin[]) => void
}

const JOIN_TYPES = [
  { value: 'INNER', label: 'INNER JOIN', description: 'Seulement les correspondances' },
  { value: 'LEFT', label: 'LEFT JOIN', description: 'Toutes les lignes de gauche' },
  { value: 'RIGHT', label: 'RIGHT JOIN', description: 'Toutes les lignes de droite' },
  { value: 'FULL', label: 'FULL JOIN', description: 'Toutes les lignes' },
]

export function JoinsTab({ joins, mainTable, selectedTable, onChange }: JoinsTabProps) {
  const handleAddJoin = () => {
    const newJoin: QueryBuilderJoin = {
      fromTable: mainTable,
      fromColumn: '',
      toTable: '',
      toColumn: '',
      joinType: 'LEFT',
      alias: `t${joins.length + 1}`,
      order: joins.length,
    }
    onChange([...joins, newJoin])
  }

  const handleUpdateJoin = (index: number, updates: Partial<QueryBuilderJoin>) => {
    const newJoins = joins.map((j, i) => (i === index ? { ...j, ...updates } : j))
    onChange(newJoins)
  }

  const handleRemoveJoin = (index: number) => {
    onChange(joins.filter((_, i) => i !== index))
  }

  if (!mainTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Link2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Sélectionnez une table principale</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Vous devez d'abord sélectionner une table principale avant d'ajouter des jointures.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Jointures ({joins.length})
        </h3>
        <Button size="sm" variant="outline" onClick={handleAddJoin}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une jointure
        </Button>
      </div>

      {joins.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
          <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucune jointure configurée</p>
          <p className="text-xs mt-1">Cliquez sur "Ajouter une jointure" pour lier des tables</p>
        </div>
      ) : (
        <div className="space-y-3">
          {joins.map((join, index) => (
            <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  Jointure {index + 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleRemoveJoin(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type de jointure</label>
                  <Select
                    value={join.joinType}
                    onValueChange={(value) => handleUpdateJoin(index, { joinType: value as QueryBuilderJoin['joinType'] })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOIN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Table à joindre</label>
                  <Select
                    value={join.toTable}
                    onValueChange={(value) => handleUpdateJoin(index, { toTable: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roles">roles</SelectItem>
                      <SelectItem value="orders">orders</SelectItem>
                      <SelectItem value="products">products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-1 rounded">{mainTable}.id</span>
                <span>=</span>
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {join.toTable || '?'}.{join.toColumn || 'id'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
