'use client'

import { ChevronDown, Filter, Layers, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'
import type { JsonValue, SafeObject } from '../../../types/common'
import { Button } from '../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../primitives/dropdown'
import { Input } from '../../primitives/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'
import { Switch } from '../../primitives/switch/switch'
import type { ColumnConfig } from './types'

// Styles pour scrollbar visible
const scrollbarStyles = `
  .filter-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .filter-scroll::-webkit-scrollbar-track {
    background: hsl(var(--muted) / 0.5);
    border-radius: 3px;
  }
  .filter-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.5);
    border-radius: 3px;
  }
  .filter-scroll::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.7);
  }
`

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'
  | 'between'

export interface AdvancedFilterRule {
  id: string
  column: string
  operator: FilterOperator
  value: JsonValue
  value2?: JsonValue
  enabled: boolean
}

export interface AdvancedFilterGroup {
  id: string
  logic: 'AND' | 'OR'
  rules: AdvancedFilterRule[]
}

interface AdvancedFiltersProps<T = SafeObject> {
  columns: ColumnConfig<T>[]
  filters: AdvancedFilterGroup[]
  onFiltersChange: (filters: AdvancedFilterGroup[]) => void
  groupsLogic?: 'AND' | 'OR'
  onGroupsLogicChange?: (logic: 'AND' | 'OR') => void
  className?: string
}

const OPERATORS: Record<
  string,
  { label: string; shortLabel: string; needsValue: boolean; needsValue2: boolean; types: string[] }
> = {
  equals: {
    label: 'est égal à',
    shortLabel: '=',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'number', 'date', 'select', 'richtext', 'boolean', 'datetime', 'multiselect', 'custom', 'formula'],
  },
  not_equals: {
    label: 'est différent de',
    shortLabel: '≠',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'number', 'date', 'select', 'richtext', 'boolean', 'datetime', 'multiselect', 'custom', 'formula'],
  },
  contains: {
    label: 'contient',
    shortLabel: '∋',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'richtext'],
  },
  not_contains: {
    label: 'ne contient pas',
    shortLabel: '∌',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'richtext'],
  },
  starts_with: {
    label: 'commence par',
    shortLabel: 'A..',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'richtext'],
  },
  ends_with: {
    label: 'se termine par',
    shortLabel: '..Z',
    needsValue: true,
    needsValue2: false,
    types: ['text', 'richtext'],
  },
  gt: {
    label: 'est supérieur à',
    shortLabel: '>',
    needsValue: true,
    needsValue2: false,
    types: ['number', 'date', 'datetime'],
  },
  gte: {
    label: 'est supérieur ou égal à',
    shortLabel: '≥',
    needsValue: true,
    needsValue2: false,
    types: ['number', 'date', 'datetime'],
  },
  lt: {
    label: 'est inférieur à',
    shortLabel: '<',
    needsValue: true,
    needsValue2: false,
    types: ['number', 'date', 'datetime'],
  },
  lte: {
    label: 'est inférieur ou égal à',
    shortLabel: '≤',
    needsValue: true,
    needsValue2: false,
    types: ['number', 'date', 'datetime'],
  },
  between: {
    label: 'est entre',
    shortLabel: '↔',
    needsValue: true,
    needsValue2: true,
    types: ['number', 'date', 'datetime'],
  },
  is_empty: {
    label: 'est vide',
    shortLabel: '∅',
    needsValue: false,
    needsValue2: false,
    types: ['text', 'number', 'date', 'datetime', 'select', 'multiselect'],
  },
  is_not_empty: {
    label: "n'est pas vide",
    shortLabel: '≠∅',
    needsValue: false,
    needsValue2: false,
    types: ['text', 'number', 'date', 'datetime', 'select', 'multiselect'],
  },
}

// Composant LogicToggle réutilisable
function LogicToggle({
  value,
  onChange,
  size = 'default',
}: {
  value: 'AND' | 'OR'
  onChange: (value: 'AND' | 'OR') => void
  size?: 'sm' | 'default'
}) {
  const isSmall = size === 'sm'
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-muted/50 p-0.5',
        isSmall ? 'text-[10px]' : 'text-xs'
      )}
    >
      <button
        type="button"
        onClick={() => onChange('AND')}
        className={cn(
          'font-medium rounded transition-all',
          isSmall ? 'px-1.5 py-0.5' : 'px-2 py-1',
          value === 'AND'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        ET
      </button>
      <button
        type="button"
        onClick={() => onChange('OR')}
        className={cn(
          'font-medium rounded transition-all',
          isSmall ? 'px-1.5 py-0.5' : 'px-2 py-1',
          value === 'OR'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        OU
      </button>
    </div>
  )
}

// Composant FilterChip pour afficher un filtre actif de manière compacte
function FilterChip({
  rule,
  columnTitle,
  onRemove,
  onToggle,
}: {
  rule: AdvancedFilterRule
  columnTitle: string
  onRemove: () => void
  onToggle: () => void
}) {
  const operator = OPERATORS[rule.operator]
  const displayValue = rule.value === '' ? '...' : String(rule.value)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all',
        rule.enabled
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-muted/50 text-muted-foreground border border-transparent line-through'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="font-medium hover:underline"
      >
        {columnTitle}
      </button>
      <span className="text-muted-foreground">{operator?.shortLabel}</span>
      {operator?.needsValue && (
        <span className="font-medium max-w-[60px] truncate">{displayValue}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-primary/20 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}

export function AdvancedFilters<T>({
  columns,
  filters,
  onFiltersChange,
  groupsLogic: externalGroupsLogic,
  onGroupsLogicChange,
  className,
}: AdvancedFiltersProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalGroupsLogic, setInternalGroupsLogic] = useState<'AND' | 'OR'>('AND')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const groupsLogic = externalGroupsLogic ?? internalGroupsLogic
  const handleGroupsLogicChange = useCallback(
    (logic: 'AND' | 'OR') => {
      if (onGroupsLogicChange) {
        onGroupsLogicChange(logic)
      } else {
        setInternalGroupsLogic(logic)
      }
    },
    [onGroupsLogicChange]
  )

  const activeFiltersCount = useMemo(() => {
    return filters.reduce((count, group) => {
      return count + group.rules.filter((rule) => rule.enabled).length
    }, 0)
  }, [filters])

  const allRules = useMemo(() => {
    return filters.flatMap((group) =>
      group.rules.map((rule) => ({ ...rule, groupId: group.id }))
    )
  }, [filters])

  // Assure qu'il y a toujours au moins un groupe
  const ensureDefaultGroup = useCallback(() => {
    if (filters.length === 0) {
      return [{ id: `group_${Date.now()}`, logic: 'AND' as const, rules: [] }]
    }
    return filters
  }, [filters])

  const addQuickFilter = useCallback(() => {
    const updatedFilters = ensureDefaultGroup()
    const firstColumn = columns[0]
    if (!firstColumn) return

    const targetGroup = updatedFilters[0]
    const newRule: AdvancedFilterRule = {
      id: `rule_${Date.now()}`,
      column: firstColumn.id,
      operator: 'contains',
      value: '',
      enabled: true,
    }

    const newFilters = updatedFilters.map((group, index) =>
      index === 0 ? { ...group, rules: [...group.rules, newRule] } : group
    )

    onFiltersChange(newFilters.length > 0 ? newFilters : [{ ...targetGroup, rules: [newRule] }])
  }, [columns, ensureDefaultGroup, onFiltersChange])

  const addFilterGroup = useCallback(() => {
    const newGroup: AdvancedFilterGroup = {
      id: `group_${Date.now()}`,
      logic: 'AND',
      rules: [],
    }
    onFiltersChange([...filters, newGroup])
    setShowAdvanced(true)
  }, [filters, onFiltersChange])

  const updateFilterGroup = useCallback(
    (groupId: string, updates: Partial<AdvancedFilterGroup>) => {
      onFiltersChange(
        filters.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
      )
    },
    [filters, onFiltersChange]
  )

  const removeFilterGroup = useCallback(
    (groupId: string) => {
      onFiltersChange(filters.filter((group) => group.id !== groupId))
    },
    [filters, onFiltersChange]
  )

  const addRule = useCallback(
    (groupId: string) => {
      const firstColumn = columns[0]
      if (!firstColumn) return

      const newRule: AdvancedFilterRule = {
        id: `rule_${Date.now()}`,
        column: firstColumn.id,
        operator: 'contains',
        value: '',
        enabled: true,
      }

      const group = filters.find((g) => g.id === groupId)
      if (group) {
        updateFilterGroup(groupId, { rules: [...group.rules, newRule] })
      }
    },
    [columns, filters, updateFilterGroup]
  )

  const updateRule = useCallback(
    (groupId: string, ruleId: string, updates: Partial<AdvancedFilterRule>) => {
      const group = filters.find((g) => g.id === groupId)
      if (!group) return

      const updatedRules = group.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
      updateFilterGroup(groupId, { rules: updatedRules })
    },
    [filters, updateFilterGroup]
  )

  const removeRule = useCallback(
    (groupId: string, ruleId: string) => {
      const group = filters.find((g) => g.id === groupId)
      if (!group) return

      const updatedRules = group.rules.filter((rule) => rule.id !== ruleId)
      updateFilterGroup(groupId, { rules: updatedRules })
    },
    [filters, updateFilterGroup]
  )

  const clearAllFilters = useCallback(() => {
    onFiltersChange([])
  }, [onFiltersChange])

  const getAvailableOperators = useCallback((columnType: string) => {
    return Object.entries(OPERATORS)
      .filter(([_, config]) => config.types.includes(columnType || 'text'))
      .map(([key, config]) => ({
        value: key,
        label: config.label,
      }))
  }, [])

  const getColumnTitle = useCallback(
    (columnId: string) => {
      return columns.find((c) => c.id === columnId)?.title || columnId
    },
    [columns]
  )

  const renderValueInput = useCallback(
    (groupId: string, rule: AdvancedFilterRule) => {
      const column = columns.find((c) => c.id === rule.column)
      if (!column) return null

      const operator = OPERATORS[rule.operator]
      if (!operator?.needsValue) {
        return (
          <span className="text-[10px] text-muted-foreground italic">
            —
          </span>
        )
      }

      const inputBaseClass = 'h-7 text-xs bg-background border-border/50 focus:border-primary'

      switch (column.type) {
        case 'select':
        case 'multiselect':
          return (
            <Select
              value={String(rule.value || '')}
              onValueChange={(value) => updateRule(groupId, rule.id, { value })}
            >
              <SelectTrigger className={cn(inputBaseClass, 'min-w-[100px]')}>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    <div className="flex items-center gap-2">
                      {opt.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                      )}
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          )

        case 'number':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={String(rule.value || '')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateRule(groupId, rule.id, { value: e.target.value })
                }
                placeholder="Val."
                className={cn(inputBaseClass, 'w-20')}
              />
              {operator.needsValue2 && (
                <>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <Input
                    type="number"
                    value={String(rule.value2 || '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateRule(groupId, rule.id, { value2: e.target.value })
                    }
                    placeholder="Val."
                    className={cn(inputBaseClass, 'w-20')}
                  />
                </>
              )}
            </div>
          )

        case 'date':
        case 'datetime':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={String(rule.value || '')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateRule(groupId, rule.id, { value: e.target.value })
                }
                className={cn(inputBaseClass, 'w-32')}
              />
              {operator.needsValue2 && (
                <>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <Input
                    type="date"
                    value={String(rule.value2 || '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateRule(groupId, rule.id, { value2: e.target.value })
                    }
                    className={cn(inputBaseClass, 'w-32')}
                  />
                </>
              )}
            </div>
          )

        case 'boolean':
          return (
            <Select
              value={String(rule.value || '')}
              onValueChange={(value) => updateRule(groupId, rule.id, { value })}
            >
              <SelectTrigger className={cn(inputBaseClass, 'w-20')}>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          )

        default:
          return (
            <Input
              value={String(rule.value || '')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateRule(groupId, rule.id, { value: e.target.value })
              }
              placeholder="Valeur..."
              className={cn(inputBaseClass, 'min-w-[80px] flex-1')}
            />
          )
      }
    },
    [columns, updateRule]
  )

  const renderFilterRule = useCallback(
    (group: AdvancedFilterGroup, rule: AdvancedFilterRule, index: number, showLogicConnector: boolean) => {
      const column = columns.find((c) => c.id === rule.column)
      const availableOperators = column ? getAvailableOperators(column.type) : getAvailableOperators('text')

      return (
        <div key={rule.id} className="space-y-1">
          {/* Connecteur logique entre les cartes */}
          {showLogicConnector && (
            <div className="flex items-center justify-center">
              <LogicToggle
                value={group.logic}
                onChange={(logic) => updateFilterGroup(group.id, { logic })}
                size="sm"
              />
            </div>
          )}

          <div
            className={cn(
              'rounded-md border transition-all',
              rule.enabled
                ? 'bg-card border-border'
                : 'bg-muted/30 border-border/50 opacity-60'
            )}
          >
            {/* Layout compact : tout sur une ou deux lignes */}
            <div className="p-2 flex items-center gap-1.5 flex-wrap">
              {/* Colonne */}
              <Select
                value={rule.column}
                onValueChange={(value) => {
                  const newColumn = columns.find((c) => c.id === value)
                  const newOperators = newColumn ? getAvailableOperators(newColumn.type) : []
                  const firstOperator = newOperators[0]?.value || 'equals'
                  updateRule(group.id, rule.id, {
                    column: value,
                    operator: firstOperator as FilterOperator,
                    value: '',
                    value2: undefined,
                  })
                }}
              >
                <SelectTrigger className="h-7 text-xs min-w-[120px] bg-background">
                  <SelectValue placeholder="Colonne" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Opérateur */}
              <Select
                value={rule.operator}
                onValueChange={(value) =>
                  updateRule(group.id, rule.id, {
                    operator: value as FilterOperator,
                    value: '',
                    value2: undefined,
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs min-w-[130px] bg-background">
                  <SelectValue placeholder="Op." />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Valeur */}
              <div className="flex-1 min-w-[100px]">
                {renderValueInput(group.id, rule)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 ml-auto">
                <Switch
                  size="sm"
                  checked={rule.enabled}
                  onCheckedChange={(checked) =>
                    updateRule(group.id, rule.id, { enabled: checked })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(group.id, rule.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    [columns, getAvailableOperators, removeRule, renderValueInput, updateFilterGroup, updateRule]
  )

  const renderFilterGroup = useCallback(
    (group: AdvancedFilterGroup, groupIndex: number) => {
      const activeRulesCount = group.rules.filter((r) => r.enabled).length

      return (
        <div key={group.id} className="space-y-1">
          {/* Connecteur entre groupes */}
          {groupIndex > 0 && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-border" />
                <LogicToggle value={groupsLogic} onChange={handleGroupsLogicChange} size="sm" />
                <div className="h-px w-6 bg-border" />
              </div>
            </div>
          )}

          {/* Carte du groupe */}
          <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
            {/* Header du groupe - compact */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Groupe {groupIndex + 1}
                </span>
                {activeRulesCount > 0 && (
                  <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary">
                    {activeRulesCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addRule(group.id)}
                  className="h-6 px-1.5 text-[10px]"
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  Ajouter
                </Button>
                {filters.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilterGroup(group.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Règles - scrollable si > 3 éléments */}
            <div
              className="p-2 overflow-y-auto space-y-1 filter-scroll"
              style={{ maxHeight: '180px' }}
            >
              {group.rules.length > 0 ? (
                group.rules.map((rule, index) => renderFilterRule(group, rule, index, index > 0))
              ) : (
                <button
                  type="button"
                  onClick={() => addRule(group.id)}
                  className="w-full py-3 border border-dashed border-border/50 rounded text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mx-auto mb-0.5" />
                  <span className="text-[10px]">Ajouter une condition</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    },
    [addRule, filters.length, groupsLogic, handleGroupsLogicChange, removeFilterGroup, renderFilterRule]
  )

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 gap-1.5 text-muted-foreground',
              activeFiltersCount > 0 && 'text-primary bg-primary/10 hover:bg-primary/15'
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          className="w-[440px] max-w-[95vw] p-0"
        >
        <div
          className="flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(500px, 70vh)' }}
        >
          {/* Injection des styles scrollbar */}
          <style>{scrollbarStyles}</style>

          {/* Header - compact - fixe */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Filtres</h3>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Filtres actifs (chips) - compact - fixe */}
          {allRules.length > 0 && (
            <div className="flex-shrink-0 px-3 py-1.5 border-b border-border/30 bg-muted/10 max-h-20 overflow-y-auto filter-scroll">
              <div className="flex flex-wrap gap-1">
                {allRules.map((rule) => (
                  <FilterChip
                    key={rule.id}
                    rule={rule}
                    columnTitle={getColumnTitle(rule.column)}
                    onRemove={() => removeRule(rule.groupId, rule.id)}
                    onToggle={() =>
                      updateRule(rule.groupId, rule.id, { enabled: !rule.enabled })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contenu principal - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 filter-scroll">
            {filters.length === 0 ? (
              /* État vide - compact */
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 mb-3">
                  <Filter className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-xs font-medium text-foreground mb-0.5">Aucun filtre</p>
                <p className="text-[10px] text-muted-foreground mb-3 max-w-[200px]">
                  Filtrez les données du tableau
                </p>
                <Button type="button" onClick={addQuickFilter} size="sm" className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter un filtre
                </Button>
              </div>
            ) : (
              /* Liste des groupes */
              <div className="space-y-2">
                {filters.map((group, index) => renderFilterGroup(group, index))}
              </div>
            )}
          </div>

          {/* Footer - compact - fixe */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/20">
            <div className="flex items-center gap-1">
              {filters.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-[10px] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-0.5" />
                  Effacer
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {filters.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFilterGroup}
                  className="h-7 text-xs"
                >
                  <Layers className="h-3 w-3 mr-0.5" />
                  Groupe
                </Button>
              )}
              <Button
                type="button"
                variant={filters.length === 0 ? 'outline' : 'default'}
                size="sm"
                onClick={filters.length === 0 ? addQuickFilter : () => setIsOpen(false)}
                className="h-7 text-xs"
              >
                {filters.length === 0 ? (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-0.5" />
                    Filtre
                  </>
                ) : (
                  'Appliquer'
                )}
              </Button>
            </div>
          </div>
        </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default AdvancedFilters
