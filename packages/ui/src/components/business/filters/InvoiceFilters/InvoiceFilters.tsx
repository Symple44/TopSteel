'use client'
import { Calendar, Euro, FileText, Filter, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useCheckboxGroupIds } from '../../../../hooks/useFormFieldIds'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type InvoiceType = 'invoice' | 'credit_note' | 'proforma' | 'receipt'
export interface InvoiceFiltersState {
  search?: string
  statuses: InvoiceStatus[]
  types: InvoiceType[]
  amountRange?: { min?: number; max?: number }
  dateRange?: { from?: string; to?: string }
  dueDateRange?: { from?: string; to?: string }
  clientIds: string[]
  projectIds: string[]
  isOverdue?: boolean
  isPaid?: boolean
  hasAttachments?: boolean
  currency?: string
}
interface InvoiceFiltersProps {
  value?: InvoiceFiltersState
  onChange?: (filters: InvoiceFiltersState) => void
  onApply?: (filters: InvoiceFiltersState) => void
  disabled?: boolean
  availableClients?: { id: string; name: string }[]
  availableProjects?: { id: string; name: string }[]
  availableCurrencies?: string[]
  className?: string
}
const invoiceStatusOptions = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Envoyée', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Payée', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'En retard', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800' },
]
const invoiceTypeOptions = [
  { value: 'invoice', label: 'Facture', icon: FileText },
  { value: 'credit_note', label: 'Avoir', icon: FileText },
  { value: 'proforma', label: 'Proforma', icon: FileText },
  { value: 'receipt', label: 'Reçu', icon: FileText },
]
export function InvoiceFilters({
  value,
  onChange,
  onApply,
  disabled = false,
  availableClients = [],
  availableProjects = [],
  availableCurrencies = ['EUR', 'USD'],
  className,
}: InvoiceFiltersProps) {
  // Generate unique IDs for checkboxes
  const checkboxIds = useCheckboxGroupIds('invoice-filters', [
    'is-overdue',
    'is-paid',
    'has-attachments',
  ])

  const [filters, setFilters] = useState<InvoiceFiltersState>(
    value || {
      statuses: [],
      types: [],
      clientIds: [],
      projectIds: [],
    }
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const updateFilters = useCallback(
    (updates: Partial<InvoiceFiltersState>) => {
      const newFilters = { ...filters, ...updates }
      setFilters(newFilters)
      onChange?.(newFilters)
    },
    [filters, onChange]
  )
  const toggleArrayValue = <T,>(array: T[], value: T): T[] => {
    return array.includes(value) ? array.filter((item) => item !== value) : [...array, value]
  }
  const handleStatusToggle = (status: InvoiceStatus) => {
    updateFilters({ statuses: toggleArrayValue(filters.statuses, status) })
  }
  const handleTypeToggle = (type: InvoiceType) => {
    updateFilters({ types: toggleArrayValue(filters.types, type) })
  }
  const clearAllFilters = () => {
    const clearedFilters: InvoiceFiltersState = {
      statuses: [],
      types: [],
      clientIds: [],
      projectIds: [],
    }
    setFilters(clearedFilters)
    onChange?.(clearedFilters)
  }
  const getActiveFiltersCount = () => {
    return (
      filters.statuses.length +
      filters.types.length +
      filters.clientIds.length +
      filters.projectIds.length +
      (filters.search ? 1 : 0) +
      (filters.amountRange?.min || filters.amountRange?.max ? 1 : 0) +
      (filters.dateRange?.from || filters.dateRange?.to ? 1 : 0) +
      (filters.dueDateRange?.from || filters.dueDateRange?.to ? 1 : 0) +
      (filters.isOverdue ? 1 : 0) +
      (filters.isPaid ? 1 : 0) +
      (filters.hasAttachments ? 1 : 0) +
      (filters.currency ? 1 : 0)
    )
  }
  const activeFiltersCount = getActiveFiltersCount()
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres factures
          {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-6 bg-background">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recherche</Label>
            <Input
              placeholder="Numéro, client, montant..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Invoice Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Statut
              </Label>
              <div className="space-y-2">
                {invoiceStatusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.statuses.includes(option.value as InvoiceStatus)}
                      onCheckedChange={() => handleStatusToggle(option.value as InvoiceStatus)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm">
                      <span className={cn('px-2 py-1 rounded text-xs', option.color)}>
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Invoice Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type de document</Label>
              <div className="space-y-2">
                {invoiceTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.types.includes(option.value as InvoiceType)}
                      onCheckedChange={() => handleTypeToggle(option.value as InvoiceType)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`type-${option.value}`}
                      className="text-sm flex items-center gap-2"
                    >
                      <option.icon className="h-3 w-3" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Amount Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Montant
            </Label>
            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label className="text-xs">Minimum</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountRange?.min || ''}
                  onChange={(e) =>
                    updateFilters({
                      amountRange: {
                        ...filters.amountRange,
                        min: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className="text-xs">Maximum</Label>
                <Input
                  type="number"
                  placeholder="Illimité"
                  value={filters.amountRange?.max || ''}
                  onChange={(e) =>
                    updateFilters({
                      amountRange: {
                        ...filters.amountRange,
                        max: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          {/* Date Ranges */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de facture
              </Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="date"
                  value={filters.dateRange?.from || ''}
                  onChange={(e) =>
                    updateFilters({
                      dateRange: { ...filters.dateRange, from: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  type="date"
                  value={filters.dateRange?.to || ''}
                  onChange={(e) =>
                    updateFilters({
                      dateRange: { ...filters.dateRange, to: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Échéance</Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="date"
                  value={filters.dueDateRange?.from || ''}
                  onChange={(e) =>
                    updateFilters({
                      dueDateRange: { ...filters.dueDateRange, from: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  type="date"
                  value={filters.dueDateRange?.to || ''}
                  onChange={(e) =>
                    updateFilters({
                      dueDateRange: { ...filters.dueDateRange, to: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          {/* Special Conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conditions spéciales</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={checkboxIds['is-overdue']}
                  checked={filters.isOverdue === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ isOverdue: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={checkboxIds['is-overdue']} className="text-sm">
                  En retard
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={checkboxIds['is-paid']}
                  checked={filters.isPaid === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ isPaid: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={checkboxIds['is-paid']} className="text-sm">
                  Payée
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={checkboxIds['has-attachments']}
                  checked={filters.hasAttachments === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ hasAttachments: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={checkboxIds['has-attachments']} className="text-sm">
                  Avec pièces jointes
                </Label>
              </div>
            </div>
          </div>
          {/* Currency */}
          {availableCurrencies.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Devise</Label>
              <Select
                value={filters.currency || ''}
                onValueChange={(value) => updateFilters({ currency: value || undefined })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les devises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les devises</SelectItem>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {onApply && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={() => onApply(filters)} disabled={disabled}>
                Appliquer les filtres
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
