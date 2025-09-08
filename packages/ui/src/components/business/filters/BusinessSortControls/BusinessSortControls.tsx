'use client'
import { ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
export type SortDirection = 'asc' | 'desc'
export interface SortField {
  key: string
  label: string
  defaultDirection?: SortDirection
}
export interface SortCriteria {
  field: string
  direction: SortDirection
  priority: number
}
export interface SortConfig {
  criteria: SortCriteria[]
  maxSorts?: number
}
interface BusinessSortControlsProps {
  fields: SortField[]
  value?: SortConfig
  onChange?: (sortConfig: SortConfig) => void
  disabled?: boolean
  maxSorts?: number
  showPriority?: boolean
  allowMultiple?: boolean
  showClearAll?: boolean
  className?: string
}
export function BusinessSortControls({
  fields,
  value,
  onChange,
  disabled = false,
  maxSorts = 3,
  showPriority = true,
  allowMultiple = true,
  showClearAll = true,
  className,
}: BusinessSortControlsProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    value || {
      criteria: [],
      maxSorts,
    }
  )
  const updateSortConfig = useCallback(
    (newConfig: SortConfig) => {
      setSortConfig(newConfig)
      onChange?.(newConfig)
    },
    [onChange]
  )
  const addSort = useCallback(
    (fieldKey: string) => {
      const field = fields.find((f) => f.key === fieldKey)
      if (!field) return
      const existingIndex = sortConfig.criteria.findIndex((c) => c.field === fieldKey)
      if (existingIndex >= 0) {
        // Toggle direction if already exists
        const newCriteria = [...sortConfig.criteria]
        newCriteria[existingIndex] = {
          ...newCriteria[existingIndex],
          direction: newCriteria[existingIndex].direction === 'asc' ? 'desc' : 'asc',
        }
        updateSortConfig({
          ...sortConfig,
          criteria: newCriteria,
        })
      } else {
        // Add new sort criteria
        if (allowMultiple) {
          // Add to existing sorts (respect maxSorts limit)
          if (sortConfig.criteria.length >= maxSorts) return
          const newPriority = Math.max(...sortConfig.criteria.map((c) => c.priority), 0) + 1
          updateSortConfig({
            ...sortConfig,
            criteria: [
              ...sortConfig.criteria,
              {
                field: fieldKey,
                direction: field.defaultDirection || 'asc',
                priority: newPriority,
              },
            ],
          })
        } else {
          // Replace existing sort
          updateSortConfig({
            ...sortConfig,
            criteria: [
              {
                field: fieldKey,
                direction: field.defaultDirection || 'asc',
                priority: 1,
              },
            ],
          })
        }
      }
    },
    [sortConfig, fields, allowMultiple, maxSorts, updateSortConfig]
  )
  const removeSort = useCallback(
    (fieldKey: string) => {
      updateSortConfig({
        ...sortConfig,
        criteria: sortConfig.criteria.filter((c) => c.field !== fieldKey),
      })
    },
    [sortConfig, updateSortConfig]
  )
  const updateSortDirection = useCallback(
    (fieldKey: string, direction: SortDirection) => {
      updateSortConfig({
        ...sortConfig,
        criteria: sortConfig.criteria.map((c) => (c.field === fieldKey ? { ...c, direction } : c)),
      })
    },
    [sortConfig, updateSortConfig]
  )
  const clearAllSorts = useCallback(() => {
    updateSortConfig({
      ...sortConfig,
      criteria: [],
    })
  }, [sortConfig, updateSortConfig])
  const _reorderSort = useCallback(
    (fieldKey: string, newPriority: number) => {
      const criteriaWithoutCurrent = sortConfig.criteria.filter((c) => c.field !== fieldKey)
      const currentCriteria = sortConfig.criteria.find((c) => c.field === fieldKey)
      if (!currentCriteria) return
      // Adjust priorities of other criteria
      const adjustedCriteria = criteriaWithoutCurrent.map((c) => ({
        ...c,
        priority: c.priority >= newPriority ? c.priority + 1 : c.priority,
      }))
      updateSortConfig({
        ...sortConfig,
        criteria: [...adjustedCriteria, { ...currentCriteria, priority: newPriority }].sort(
          (a, b) => a.priority - b.priority
        ),
      })
    },
    [sortConfig, updateSortConfig]
  )
  const getFieldLabel = (fieldKey: string): string => {
    return fields.find((f) => f.key === fieldKey)?.label || fieldKey
  }
  const getDirectionIcon = (direction: SortDirection) => {
    return direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }
  const availableFields = fields.filter(
    (f) => !sortConfig.criteria.some((c) => c.field === f.key) || !allowMultiple
  )
  const sortedCriteria = [...sortConfig.criteria].sort((a, b) => a.priority - b.priority)
  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Sort Controls */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Trier par:</Label>
        {/* Quick Sort Buttons */}
        <div className="flex items-center gap-1">
          {fields.slice(0, 3).map((field) => {
            const currentSort = sortConfig.criteria.find((c) => c.field === field.key)
            const isActive = !!currentSort
            return (
              <Button
                key={field.key}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => addSort(field.key)}
                disabled={disabled}
                className="h-8"
              >
                <span className="text-xs">{field.label}</span>
                {isActive ? (
                  getDirectionIcon(currentSort.direction)
                ) : (
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            )
          })}
        </div>
        {/* Dropdown for additional fields */}
        {availableFields.length > 0 && allowMultiple && sortConfig.criteria.length < maxSorts && (
          <Select onValueChange={addSort} disabled={disabled}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Ajouter un tri..." />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* Clear All Button */}
        {showClearAll && sortConfig.criteria.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllSorts}
            disabled={disabled}
            className="h-8"
          >
            <X className="h-3 w-3" />
            Effacer
          </Button>
        )}
      </div>
      {/* Active Sort Criteria */}
      {sortedCriteria.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Tris actifs ({sortedCriteria.length}):</Label>
          <div className="flex flex-wrap gap-2">
            {sortedCriteria.map((criteria) => (
              <Badge
                key={criteria.field}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                {showPriority && allowMultiple && (
                  <span className="text-xs font-mono bg-muted px-1 rounded">
                    {criteria.priority}
                  </span>
                )}
                <span className="text-xs">{getFieldLabel(criteria.field)}</span>
                {/* Direction Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateSortDirection(
                      criteria.field,
                      criteria.direction === 'asc' ? 'desc' : 'asc'
                    )
                  }
                  disabled={disabled}
                  className="h-4 w-4 p-0"
                >
                  {getDirectionIcon(criteria.direction)}
                </Button>
                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSort(criteria.field)}
                  disabled={disabled}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          {/* Priority Adjustment for Multiple Sorts */}
          {allowMultiple && showPriority && sortedCriteria.length > 1 && (
            <div className="text-xs text-muted-foreground">
              Cliquez sur les numéros pour réorganiser la priorité des tris
            </div>
          )}
        </div>
      )}
      {/* Sort Summary */}
      {sortConfig.criteria.length > 0 && (
        <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          <strong>Tri appliqué:</strong>{' '}
          {sortedCriteria.map((criteria, index) => (
            <span key={criteria.field}>
              {index > 0 && ' puis '}
              {getFieldLabel(criteria.field)} (
              {criteria.direction === 'asc' ? 'croissant' : 'décroissant'})
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
