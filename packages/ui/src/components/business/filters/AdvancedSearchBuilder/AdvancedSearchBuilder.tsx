'use client'
import { useState, useCallback } from 'react'
import { Plus, Trash2, ChevronDown, Search } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Label } from '../../../forms/label/Label'
import { cn } from '../../../../lib/utils'
export type SearchFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean'
export type SearchOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 
  'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
export type LogicalOperator = 'AND' | 'OR'
export interface SearchField {
  key: string
  label: string
  type: SearchFieldType
  options?: { value: string; label: string }[]
}
export interface SearchCondition {
  id: string
  field: string
  operator: SearchOperator
  value: string | string[] | number | boolean | null
  logicalOperator?: LogicalOperator
}
export interface SearchQuery {
  conditions: SearchCondition[]
  globalOperator: LogicalOperator
}
interface AdvancedSearchBuilderProps {
  fields: SearchField[]
  value?: SearchQuery
  onChange?: (query: SearchQuery) => void
  onSearch?: (query: SearchQuery) => void
  placeholder?: string
  disabled?: boolean
  maxConditions?: number
  className?: string
}
const operatorsByType: Record<SearchFieldType, SearchOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_null', 'is_not_null'],
  date: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_null', 'is_not_null'],
  select: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
  boolean: ['equals', 'not_equals'],
}
const operatorLabels: Record<SearchOperator, string> = {
  equals: 'égal à',
  not_equals: 'différent de',
  contains: 'contient',
  not_contains: 'ne contient pas',
  starts_with: 'commence par',
  ends_with: 'finit par',
  greater_than: 'supérieur à',
  less_than: 'inférieur à',
  greater_than_or_equal: 'supérieur ou égal à',
  less_than_or_equal: 'inférieur ou égal à',
  in: 'parmi',
  not_in: 'pas parmi',
  is_null: 'est vide',
  is_not_null: 'n\'est pas vide',
}
export function AdvancedSearchBuilder({
  fields,
  value,
  onChange,
  onSearch,
  placeholder = "Construire une requête de recherche avancée...",
  disabled = false,
  maxConditions = 10,
  className,
}: AdvancedSearchBuilderProps) {
  const [query, setQuery] = useState<SearchQuery>(value || {
    conditions: [],
    globalOperator: 'AND'
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const updateQuery = useCallback((newQuery: SearchQuery) => {
    setQuery(newQuery)
    onChange?.(newQuery)
  }, [onChange])
  const addCondition = useCallback(() => {
    if (query.conditions.length >= maxConditions) return
    const newCondition: SearchCondition = {
      id: Date.now().toString(),
      field: fields[0]?.key || '',
      operator: 'equals',
      value: '',
      logicalOperator: query.conditions.length > 0 ? query.globalOperator : undefined
    }
    updateQuery({
      ...query,
      conditions: [...query.conditions, newCondition]
    })
  }, [query, fields, maxConditions, updateQuery])
  const removeCondition = useCallback((conditionId: string) => {
    updateQuery({
      ...query,
      conditions: query.conditions.filter(c => c.id !== conditionId)
    })
  }, [query, updateQuery])
  const updateCondition = useCallback((conditionId: string, updates: Partial<SearchCondition>) => {
    updateQuery({
      ...query,
      conditions: query.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    })
  }, [query, updateQuery])
  const updateGlobalOperator = useCallback((operator: LogicalOperator) => {
    updateQuery({
      ...query,
      globalOperator: operator,
      conditions: query.conditions.map((c, index) => 
        index > 0 ? { ...c, logicalOperator: operator } : c
      )
    })
  }, [query, updateQuery])
  const handleSearch = useCallback(() => {
    onSearch?.(query)
  }, [query, onSearch])
  const clearAll = useCallback(() => {
    updateQuery({
      conditions: [],
      globalOperator: 'AND'
    })
  }, [updateQuery])
  const getFieldType = (fieldKey: string): SearchFieldType => {
    return fields.find(f => f.key === fieldKey)?.type || 'text'
  }
  const renderValueInput = (condition: SearchCondition) => {
    const field = fields.find(f => f.key === condition.field)
    const needsValue = !['is_null', 'is_not_null'].includes(condition.operator)
    if (!needsValue) return null
    switch (field?.type) {
      case 'select':
        if (['in', 'not_in'].includes(condition.operator)) {
          // Multi-select for 'in' operators
          return (
            <div className="space-y-1">
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(condition.value) && condition.value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(condition.value) ? condition.value : []
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value)
                      updateCondition(condition.id, { value: newValues })
                    }}
                    disabled={disabled}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )
        } else {
          // Single select
          return (
            <Select
              value={condition.value as string}
              onValueChange={(value) => updateCondition(condition.id, { value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      case 'boolean':
        return (
          <Select
            value={condition.value as string}
            onValueChange={(value) => updateCondition(condition.id, { value: value === 'true' })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        )
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value as string}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            disabled={disabled}
            placeholder="Valeur numérique..."
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={condition.value as string}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            disabled={disabled}
          />
        )
      default:
        return (
          <Input
            type="text"
            value={condition.value as string}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            disabled={disabled}
            placeholder="Valeur..."
          />
        )
    }
  }
  const hasActiveFilters = query.conditions.length > 0
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {placeholder}
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                {query.conditions.length}
              </span>
            )}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
        </Button>
      </div>
      {/* Expanded Search Builder */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-background">
          {/* Global Operator */}
          {query.conditions.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Liaison:</Label>
              <Select
                value={query.globalOperator}
                onValueChange={(value) => updateGlobalOperator(value as LogicalOperator)}
                disabled={disabled}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ET</SelectItem>
                  <SelectItem value="OR">OU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Conditions */}
          <div className="space-y-3">
            {query.conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-start gap-2 p-3 border rounded-lg">
                {/* Logical Operator */}
                {index > 0 && (
                  <div className="flex items-center justify-center w-12 h-8 text-xs font-medium bg-muted rounded">
                    {condition.logicalOperator}
                  </div>
                )}
                {/* Field */}
                <div className="flex-1 min-w-0">
                  <Select
                    value={condition.field}
                    onValueChange={(field) => {
                      const fieldType = getFieldType(field)
                      const availableOperators = operatorsByType[fieldType]
                      const newOperator = availableOperators.includes(condition.operator) 
                        ? condition.operator 
                        : availableOperators[0]
                      updateCondition(condition.id, { 
                        field, 
                        operator: newOperator,
                        value: ''
                      })
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Operator */}
                <div className="flex-1 min-w-0">
                  <Select
                    value={condition.operator}
                    onValueChange={(operator) => updateCondition(condition.id, { 
                      operator: operator as SearchOperator,
                      value: ['is_null', 'is_not_null'].includes(operator) ? null : ''
                    })}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsByType[getFieldType(condition.field)].map((op) => (
                        <SelectItem key={op} value={op}>
                          {operatorLabels[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Value */}
                <div className="flex-1 min-w-0">
                  {renderValueInput(condition)}
                </div>
                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
                disabled={disabled || query.conditions.length >= maxConditions}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter condition
              </Button>
              {query.conditions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={disabled}
                >
                  Effacer tout
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
                disabled={disabled}
              >
                Fermer
              </Button>
              {onSearch && (
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={disabled || query.conditions.length === 0}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Rechercher
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
