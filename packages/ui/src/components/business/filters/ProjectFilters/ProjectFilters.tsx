'use client'
import { Calendar, Filter, Folder, MapPin, Users, X } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
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
export type ProjectStatus =
  | 'draft'
  | 'planning'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectType = 'manufacturing' | 'maintenance' | 'installation' | 'design' | 'consulting'
export interface ProjectFiltersState {
  search?: string
  statuses: ProjectStatus[]
  priorities: ProjectPriority[]
  types: ProjectType[]
  clientIds: string[]
  teamMemberIds: string[]
  managerIds: string[]
  budgetRange?: { min?: number; max?: number }
  startDateRange?: { from?: string; to?: string }
  endDateRange?: { from?: string; to?: string }
  locations: string[]
  isOverdue?: boolean
  hasActiveTasks?: boolean
  hasIssues?: boolean
}
interface ProjectFiltersProps {
  value?: ProjectFiltersState
  onChange?: (filters: ProjectFiltersState) => void
  onApply?: (filters: ProjectFiltersState) => void
  disabled?: boolean
  availableClients?: { id: string; name: string }[]
  availableTeamMembers?: { id: string; name: string }[]
  availableManagers?: { id: string; name: string }[]
  availableLocations?: string[]
  className?: string
}
const projectStatusOptions = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  { value: 'planning', label: 'Planification', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'En cours', color: 'bg-green-100 text-green-800' },
  { value: 'on_hold', label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Terminé', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
]
const projectPriorityOptions = [
  { value: 'low', label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' },
]
const projectTypeOptions = [
  { value: 'manufacturing', label: 'Fabrication', icon: Folder },
  { value: 'maintenance', label: 'Maintenance', icon: Folder },
  { value: 'installation', label: 'Installation', icon: Folder },
  { value: 'design', label: 'Conception', icon: Folder },
  { value: 'consulting', label: 'Conseil', icon: Folder },
]
export function ProjectFilters({
  value,
  onChange,
  onApply,
  disabled = false,
  availableClients = [],
  availableTeamMembers = [],
  availableManagers = [],
  availableLocations = [],
  className,
}: ProjectFiltersProps) {
  const overdueId = useId()
  const activeTasksId = useId()
  const hasIssuesId = useId()

  const [filters, setFilters] = useState<ProjectFiltersState>(
    value || {
      statuses: [],
      priorities: [],
      types: [],
      clientIds: [],
      teamMemberIds: [],
      managerIds: [],
      locations: [],
    }
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const updateFilters = useCallback(
    (updates: Partial<ProjectFiltersState>) => {
      const newFilters = { ...filters, ...updates }
      setFilters(newFilters)
      onChange?.(newFilters)
    },
    [filters, onChange]
  )
  const toggleArrayValue = <T,>(array: T[], value: T): T[] => {
    return array.includes(value) ? array.filter((item) => item !== value) : [...array, value]
  }
  const handleStatusToggle = (status: ProjectStatus) => {
    updateFilters({ statuses: toggleArrayValue(filters.statuses, status) })
  }
  const handlePriorityToggle = (priority: ProjectPriority) => {
    updateFilters({ priorities: toggleArrayValue(filters.priorities, priority) })
  }
  const handleTypeToggle = (type: ProjectType) => {
    updateFilters({ types: toggleArrayValue(filters.types, type) })
  }
  const clearAllFilters = () => {
    const clearedFilters: ProjectFiltersState = {
      statuses: [],
      priorities: [],
      types: [],
      clientIds: [],
      teamMemberIds: [],
      managerIds: [],
      locations: [],
    }
    setFilters(clearedFilters)
    onChange?.(clearedFilters)
  }
  const getActiveFiltersCount = () => {
    return (
      filters.statuses.length +
      filters.priorities.length +
      filters.types.length +
      filters.clientIds.length +
      filters.teamMemberIds.length +
      filters.managerIds.length +
      filters.locations.length +
      (filters.search ? 1 : 0) +
      (filters.budgetRange?.min || filters.budgetRange?.max ? 1 : 0) +
      (filters.startDateRange?.from || filters.startDateRange?.to ? 1 : 0) +
      (filters.endDateRange?.from || filters.endDateRange?.to ? 1 : 0) +
      (filters.isOverdue ? 1 : 0) +
      (filters.hasActiveTasks ? 1 : 0) +
      (filters.hasIssues ? 1 : 0)
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
          Filtres projets
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
              placeholder="Nom, description, référence..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Project Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Statut
              </Label>
              <div className="space-y-2">
                {projectStatusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.statuses.includes(option.value as ProjectStatus)}
                      onCheckedChange={() => handleStatusToggle(option.value as ProjectStatus)}
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
            {/* Project Priority */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Priorité</Label>
              <div className="space-y-2">
                {projectPriorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priorities.includes(option.value as ProjectPriority)}
                      onCheckedChange={() => handlePriorityToggle(option.value as ProjectPriority)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`priority-${option.value}`} className="text-sm">
                      <span className={cn('px-2 py-1 rounded text-xs', option.color)}>
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {/* Project Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type</Label>
              <div className="space-y-2">
                {projectTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.types.includes(option.value as ProjectType)}
                      onCheckedChange={() => handleTypeToggle(option.value as ProjectType)}
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
          {/* Budget Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Budget (€)</Label>
            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label className="text-xs">Minimum</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.budgetRange?.min || ''}
                  onChange={(e) =>
                    updateFilters({
                      budgetRange: {
                        ...filters.budgetRange,
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
                  value={filters.budgetRange?.max || ''}
                  onChange={(e) =>
                    updateFilters({
                      budgetRange: {
                        ...filters.budgetRange,
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
                Date de début
              </Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="date"
                  value={filters.startDateRange?.from || ''}
                  onChange={(e) =>
                    updateFilters({
                      startDateRange: { ...filters.startDateRange, from: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  type="date"
                  value={filters.startDateRange?.to || ''}
                  onChange={(e) =>
                    updateFilters({
                      startDateRange: { ...filters.startDateRange, to: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date de fin</Label>
              <div className="grid gap-2 grid-cols-2">
                <Input
                  type="date"
                  value={filters.endDateRange?.from || ''}
                  onChange={(e) =>
                    updateFilters({
                      endDateRange: { ...filters.endDateRange, from: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  type="date"
                  value={filters.endDateRange?.to || ''}
                  onChange={(e) =>
                    updateFilters({
                      endDateRange: { ...filters.endDateRange, to: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          {/* Location */}
          {availableLocations.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localisation
              </Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !filters.locations.includes(value)) {
                    updateFilters({ locations: [...filters.locations, value] })
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ajouter une localisation..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations
                    .filter((location) => !filters.locations.includes(location))
                    .map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {filters.locations.map((location) => (
                  <Badge key={location} variant="secondary" className="text-xs">
                    {location}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() =>
                        updateFilters({
                          locations: filters.locations.filter((l) => l !== location),
                        })
                      }
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* Team & Assignees */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Team Members */}
            {availableTeamMembers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Équipe
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.teamMemberIds.includes(value)) {
                      updateFilters({ teamMemberIds: [...filters.teamMemberIds, value] })
                    }
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter un membre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamMembers
                      .filter((member) => !filters.teamMemberIds.includes(member.id))
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Managers */}
            {availableManagers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Responsable</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.managerIds.includes(value)) {
                      updateFilters({ managerIds: [...filters.managerIds, value] })
                    }
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter un responsable..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableManagers
                      .filter((manager) => !filters.managerIds.includes(manager.id))
                      .map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Special Conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conditions spéciales</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={overdueId}
                  checked={filters.isOverdue === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ isOverdue: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={overdueId} className="text-sm">
                  En retard
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={activeTasksId}
                  checked={filters.hasActiveTasks === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ hasActiveTasks: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={activeTasksId} className="text-sm">
                  Tâches actives
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={hasIssuesId}
                  checked={filters.hasIssues === true}
                  onCheckedChange={(checked) =>
                    updateFilters({ hasIssues: checked ? true : undefined })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={hasIssuesId} className="text-sm">
                  Avec problèmes
                </Label>
              </div>
            </div>
          </div>
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
