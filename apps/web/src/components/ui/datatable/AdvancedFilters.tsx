'use client'

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@erp/ui'
import { DropdownPortal, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown-portal'
import { SelectPortal } from '@/components/ui/select-portal'
import { 
  Filter, 
  Plus, 
  X, 
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  ChevronDown,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { ColumnConfig } from './types'

export type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'is_empty' | 'is_not_empty'
  | 'in' | 'not_in'
  | 'between'

export interface AdvancedFilterRule {
  id: string
  column: string
  operator: FilterOperator
  value: any
  value2?: any // Pour l'opérateur "between"
  enabled: boolean
}

export interface AdvancedFilterGroup {
  id: string
  logic: 'AND' | 'OR'
  rules: AdvancedFilterRule[]
}

interface AdvancedFiltersProps<T = any> {
  columns: ColumnConfig<T>[]
  filters: AdvancedFilterGroup[]
  onFiltersChange: (filters: AdvancedFilterGroup[]) => void
  className?: string
}

const OPERATORS: Record<string, { label: string, needsValue: boolean, needsValue2: boolean, types: string[] }> = {
  equals: { label: 'Égal à', needsValue: true, needsValue2: false, types: ['text', 'number', 'date', 'select', 'richtext'] },
  not_equals: { label: 'Différent de', needsValue: true, needsValue2: false, types: ['text', 'number', 'date', 'select', 'richtext'] },
  contains: { label: 'Contient', needsValue: true, needsValue2: false, types: ['text', 'richtext'] },
  not_contains: { label: 'Ne contient pas', needsValue: true, needsValue2: false, types: ['text', 'richtext'] },
  starts_with: { label: 'Commence par', needsValue: true, needsValue2: false, types: ['text', 'richtext'] },
  ends_with: { label: 'Se termine par', needsValue: true, needsValue2: false, types: ['text', 'richtext'] },
  gt: { label: 'Supérieur à', needsValue: true, needsValue2: false, types: ['number', 'date'] },
  gte: { label: 'Supérieur ou égal à', needsValue: true, needsValue2: false, types: ['number', 'date'] },
  lt: { label: 'Inférieur à', needsValue: true, needsValue2: false, types: ['number', 'date'] },
  lte: { label: 'Inférieur ou égal à', needsValue: true, needsValue2: false, types: ['number', 'date'] },
  between: { label: 'Entre', needsValue: true, needsValue2: true, types: ['number', 'date'] },
  in: { label: 'Dans la liste', needsValue: true, needsValue2: false, types: ['text', 'number', 'select'] },
  not_in: { label: 'Pas dans la liste', needsValue: true, needsValue2: false, types: ['text', 'number', 'select'] },
  is_empty: { label: 'Est vide', needsValue: false, needsValue2: false, types: ['text', 'number', 'date'] },
  is_not_empty: { label: 'N\'est pas vide', needsValue: false, needsValue2: false, types: ['text', 'number', 'date'] }
}

export function AdvancedFilters<T>({ 
  columns, 
  filters, 
  onFiltersChange, 
  className 
}: AdvancedFiltersProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFiltersCount = useMemo(() => {
    return filters.reduce((count, group) => {
      return count + group.rules.filter(rule => rule.enabled).length
    }, 0)
  }, [filters])

  const addFilterGroup = () => {
    const newGroup: AdvancedFilterGroup = {
      id: `group_${Date.now()}`,
      logic: 'AND',
      rules: []
    }
    onFiltersChange([...filters, newGroup])
  }

  const updateFilterGroup = (groupId: string, updates: Partial<AdvancedFilterGroup>) => {
    onFiltersChange(filters.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ))
  }

  const removeFilterGroup = (groupId: string) => {
    onFiltersChange(filters.filter(group => group.id !== groupId))
  }

  const addRule = (groupId: string) => {
    const firstColumn = columns.find(col => col.searchable !== false)
    if (!firstColumn) return

    const newRule: AdvancedFilterRule = {
      id: `rule_${Date.now()}`,
      column: firstColumn.id,
      operator: 'equals',
      value: '',
      enabled: true
    }

    updateFilterGroup(groupId, {
      rules: [...(filters.find(g => g.id === groupId)?.rules || []), newRule]
    })
  }

  const updateRule = (groupId: string, ruleId: string, updates: Partial<AdvancedFilterRule>) => {
    const group = filters.find(g => g.id === groupId)
    if (!group) return

    const updatedRules = group.rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    )
    updateFilterGroup(groupId, { rules: updatedRules })
  }

  const removeRule = (groupId: string, ruleId: string) => {
    const group = filters.find(g => g.id === groupId)
    if (!group) return

    const updatedRules = group.rules.filter(rule => rule.id !== ruleId)
    updateFilterGroup(groupId, { rules: updatedRules })
  }

  const clearAllFilters = () => {
    onFiltersChange([])
    setIsOpen(false)
  }

  const getAvailableOperators = (columnType: string) => {
    return Object.entries(OPERATORS).filter(([_, config]) => 
      config.types.includes(columnType)
    ).map(([key, config]) => ({
      value: key,
      label: config.label
    }))
  }

  const renderValueInput = (group: AdvancedFilterGroup, rule: AdvancedFilterRule) => {
    const column = columns.find(c => c.id === rule.column)
    if (!column) return null

    const operator = OPERATORS[rule.operator]
    if (!operator?.needsValue) return null

    switch (column.type) {
      case 'select':
        return (
          <SelectPortal
            value={rule.value}
            onValueChange={(value) => updateRule(group.id, rule.id, { value })}
            options={column.options?.map(opt => ({
              value: String(opt.value),
              label: opt.label,
              color: opt.color
            })) || []}
            placeholder="Sélectionner..."
            className="h-8 text-xs min-w-[120px]"
          />
        )

      case 'number':
        return (
          <div className="flex gap-1">
            <Input
              type="number"
              value={rule.value || ''}
              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
              placeholder="Valeur"
              className="h-8 text-xs w-20"
            />
            {operator.needsValue2 && (
              <Input
                type="number"
                value={rule.value2 || ''}
                onChange={(e) => updateRule(group.id, rule.id, { value2: e.target.value })}
                placeholder="Valeur 2"
                className="h-8 text-xs w-20"
              />
            )}
          </div>
        )

      case 'date':
        return (
          <div className="flex gap-1">
            <Input
              type="date"
              value={rule.value || ''}
              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
              className="h-8 text-xs w-32"
            />
            {operator.needsValue2 && (
              <Input
                type="date"
                value={rule.value2 || ''}
                onChange={(e) => updateRule(group.id, rule.id, { value2: e.target.value })}
                className="h-8 text-xs w-32"
              />
            )}
          </div>
        )

      default:
        return (
          <Input
            value={rule.value || ''}
            onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
            placeholder="Valeur"
            className="h-8 text-xs min-w-[120px]"
          />
        )
    }
  }

  const renderFilterRule = (group: AdvancedFilterGroup, rule: AdvancedFilterRule, index: number) => {
    const column = columns.find(c => c.id === rule.column)
    const availableOperators = column ? getAvailableOperators(column.type) : []

    return (
      <div key={rule.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
        {/* Logic connector pour les règles après la première */}
        {index > 0 && (
          <SelectPortal
            value={group.logic}
            onValueChange={(value: 'AND' | 'OR') => updateFilterGroup(group.id, { logic: value })}
            options={[
              { value: 'AND', label: 'ET' },
              { value: 'OR', label: 'OU' }
            ]}
            className="h-7 text-xs w-14"
          />
        )}

        {/* Column selector */}
        <SelectPortal
          value={rule.column}
          onValueChange={(value) => {
            const newColumn = columns.find(c => c.id === value)
            const firstOperator = newColumn ? getAvailableOperators(newColumn.type)[0]?.value : 'equals'
            updateRule(group.id, rule.id, { 
              column: value, 
              operator: firstOperator as FilterOperator,
              value: '',
              value2: undefined 
            })
          }}
          options={columns
            .filter(col => col.searchable !== false)
            .map(col => ({
              value: col.id,
              label: col.title
            }))
          }
          className="h-7 text-xs min-w-[100px]"
        />

        {/* Operator selector */}
        <SelectPortal
          value={rule.operator}
          onValueChange={(value) => updateRule(group.id, rule.id, { 
            operator: value as FilterOperator,
            value: '',
            value2: undefined 
          })}
          options={availableOperators}
          className="h-7 text-xs min-w-[120px]"
        />

        {/* Value input(s) */}
        {renderValueInput(group, rule)}

        {/* Enable/Disable toggle */}
        <Button
          variant={rule.enabled ? "default" : "outline"}
          size="sm"
          onClick={() => updateRule(group.id, rule.id, { enabled: !rule.enabled })}
          className="h-7 w-7 p-0"
        >
          <ToggleLeft className={cn(
            "h-3 w-3 transition-transform",
            rule.enabled && "rotate-180"
          )} />
        </Button>

        {/* Remove rule */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRule(group.id, rule.id)}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const renderFilterGroup = (group: AdvancedFilterGroup, groupIndex: number) => {
    return (
      <div key={group.id} className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Groupe {groupIndex + 1}</span>
            {groupIndex > 0 && (
              <Badge variant="outline" className="text-xs">
                ET
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRule(group.id)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Règle
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilterGroup(group.id)}
              className="h-7 w-7 p-0 text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {group.rules.map((rule, index) => renderFilterRule(group, rule, index))}
          {group.rules.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Aucune règle de filtrage
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <DropdownPortal
        open={isOpen}
        onOpenChange={setIsOpen}
        align="start"
        side="bottom"
        className="min-w-[800px] max-w-[90vw] max-h-[80vh] overflow-auto p-0"
        trigger={
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtres avancés
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        }
        onInteractOutside={(event) => {
          // Ne pas fermer si on clique sur un SelectPortal
          const target = event.target as Element
          if (target.closest('[data-select-portal]') || target.closest('[role="listbox"]') || target.closest('[role="option"]')) {
            event.preventDefault()
            return
          }
          // Sinon, fermer le dropdown
          setIsOpen(false)
        }}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtres avancés</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addFilterGroup}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Groupe
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-red-600"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Tout effacer
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filters.map((group, index) => renderFilterGroup(group, index))}
            {filters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun filtre configuré</p>
                <p className="text-xs text-gray-400">Cliquez sur "Groupe" pour commencer</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Appliquer les filtres
            </Button>
          </div>
        </div>
      </DropdownPortal>
    </div>
  )
}

export default AdvancedFilters