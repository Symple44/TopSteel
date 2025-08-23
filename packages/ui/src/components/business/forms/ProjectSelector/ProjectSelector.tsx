'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  FolderOpen,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Calendar,
  User,
  DollarSign,
  Progress as ProgressIcon,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  Plus
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Input } from '../../../primitives/input/Input'
import { Progress } from '../../../data-display/progress/progress'
export type ProjectStatus = 
  | 'draft' 
  | 'planning' 
  | 'active' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export interface ProjectMember {
  id: string
  name: string
  role: string
  avatar?: string
}
export interface Project {
  id: string
  name: string
  code: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  progress: number // 0-100
  budget?: {
    allocated: number
    spent: number
    currency: string
  }
  dates: {
    startDate?: Date
    endDate?: Date
    createdAt: Date
    lastActivity?: Date
  }
  client?: {
    id: string
    name: string
    company?: string
  }
  manager?: ProjectMember
  team?: ProjectMember[]
  location?: string
  tags?: string[]
  category?: string
  isArchived?: boolean
  isFavorite?: boolean
  requirements?: string[]
  deliverables?: Array<{
    id: string
    name: string
    completed: boolean
    dueDate?: Date
  }>
}
export interface ProjectSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[] | undefined) => void
  onProjectSelect?: (project: Project) => void
  projects?: Project[]
  multiple?: boolean
  searchable?: boolean
  filterable?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  showProgress?: boolean
  showBudget?: boolean
  showTeam?: boolean
  showDates?: boolean
  filterByStatus?: ProjectStatus[]
  filterByManager?: string
  filterByClient?: string
  sortBy?: 'name' | 'status' | 'progress' | 'date' | 'priority'
  groupBy?: 'status' | 'manager' | 'client' | 'priority'
  allowCreateNew?: boolean
  onCreateNew?: () => void
  className?: string
  maxHeight?: string
}
const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: <Progress /> },
  planning: { label: 'Planification', color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-3 h-3" /> },
  active: { label: 'En cours', color: 'bg-green-100 text-green-800', icon: <Play className="w-3 h-3" /> },
  on_hold: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="w-3 h-3" /> },
  completed: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
}
const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700' },
}
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Rénovation usine Lille',
    code: 'REN-LILLE-2024',
    description: 'Modernisation de la ligne de production principale',
    status: 'active',
    priority: 'high',
    progress: 65,
    budget: {
      allocated: 450000,
      spent: 285000,
      currency: 'EUR'
    },
    dates: {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      createdAt: new Date('2023-12-01'),
      lastActivity: new Date('2024-01-20')
    },
    client: {
      id: 'client1',
      name: 'Jean Dupont',
      company: 'Industries Nord'
    },
    manager: {
      id: 'mgr1',
      name: 'Marie Martin',
      role: 'Chef de projet'
    },
    team: [
      { id: 'tm1', name: 'Pierre Durand', role: 'Ingénieur' },
      { id: 'tm2', name: 'Sophie Bernard', role: 'Technicienne' }
    ],
    location: 'Lille, France',
    tags: ['rénovation', 'production', 'urgent'],
    category: 'Industrie',
    isFavorite: true
  },
  {
    id: '2',
    name: 'Construction entrepôt Lyon',
    code: 'CONST-LYON-2024',
    description: 'Nouvel entrepôt logistique de 5000m²',
    status: 'planning',
    priority: 'medium',
    progress: 15,
    budget: {
      allocated: 750000,
      spent: 35000,
      currency: 'EUR'
    },
    dates: {
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-10-15'),
      createdAt: new Date('2024-01-10'),
    },
    client: {
      id: 'client2',
      name: 'Logistics SA',
      company: 'Logistics SA'
    },
    manager: {
      id: 'mgr2',
      name: 'Laurent Petit',
      role: 'Chef de projet'
    },
    location: 'Lyon, France',
    tags: ['construction', 'entrepôt', 'logistique'],
    category: 'Construction',
    isFavorite: false
  }
]
export function ProjectSelector({
  value,
  onChange,
  onProjectSelect,
  projects = MOCK_PROJECTS,
  multiple = false,
  searchable = true,
  filterable = true,
  required = false,
  disabled = false,
  placeholder = multiple ? 'Sélectionner des projets...' : 'Sélectionner un projet...',
  label,
  helperText,
  error,
  showProgress = true,
  showBudget = false,
  showTeam = true,
  showDates = true,
  filterByStatus,
  filterByManager,
  filterByClient,
  sortBy = 'name',
  groupBy,
  allowCreateNew = false,
  onCreateNew,
  className,
  maxHeight = '400px',
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    multiple && Array.isArray(value) ? value : 
    !multiple && typeof value === 'string' ? [value] :
    []
  )
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedProjects(value)
    } else if (!multiple && typeof value === 'string') {
      setSelectedProjects([value])
    }
  }, [value, multiple])
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Archived projects filter
      if (project.isArchived) return false
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          project.name.toLowerCase().includes(searchLower) ||
          project.code.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.client?.name.toLowerCase().includes(searchLower) ||
          project.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      // Status filter
      if (statusFilter && project.status !== statusFilter) {
        return false
      }
      // Priority filter
      if (priorityFilter && project.priority !== priorityFilter) {
        return false
      }
      // External filters
      if (filterByStatus && !filterByStatus.includes(project.status)) {
        return false
      }
      if (filterByManager && project.manager?.id !== filterByManager) {
        return false
      }
      if (filterByClient && project.client?.id !== filterByClient) {
        return false
      }
      return true
    })
    // Sort projects
    switch (sortBy) {
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status))
        break
      case 'progress':
        filtered.sort((a, b) => b.progress - a.progress)
        break
      case 'date':
        filtered.sort((a, b) => {
          const aDate = a.dates.startDate || a.dates.createdAt
          const bDate = b.dates.startDate || b.dates.createdAt
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
        break
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }
    return filtered
  }, [projects, searchTerm, statusFilter, priorityFilter, filterByStatus, filterByManager, filterByClient, sortBy])
  const groupedProjects = useMemo(() => {
    if (!groupBy) return { '': filteredProjects }
    const grouped: Record<string, Project[]> = {}
    filteredProjects.forEach(project => {
      let groupKey = ''
      switch (groupBy) {
        case 'status':
          groupKey = STATUS_CONFIG[project.status].label
          break
        case 'manager':
          groupKey = project.manager?.name || 'Sans responsable'
          break
        case 'client':
          groupKey = project.client?.company || project.client?.name || 'Sans client'
          break
        case 'priority':
          groupKey = PRIORITY_CONFIG[project.priority].label
          break
      }
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(project)
    })
    return grouped
  }, [filteredProjects, groupBy])
  const handleProjectToggle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    if (multiple) {
      const newSelection = selectedProjects.includes(projectId)
        ? selectedProjects.filter(id => id !== projectId)
        : [...selectedProjects, projectId]
      setSelectedProjects(newSelection)
      onChange?.(newSelection)
    } else {
      const newSelection = selectedProjects.includes(projectId) ? [] : [projectId]
      setSelectedProjects(newSelection)
      onChange?.(newSelection[0])
      setIsOpen(false)
    }
    onProjectSelect?.(project)
  }
  const getSelectedProjectsDisplay = () => {
    if (selectedProjects.length === 0) return placeholder
    if (multiple) {
      if (selectedProjects.length === 1) {
        const project = projects.find(p => p.id === selectedProjects[0])
        return project?.name || 'Projet sélectionné'
      }
      return `${selectedProjects.length} projets sélectionnés`
    } else {
      const project = projects.find(p => p.id === selectedProjects[0])
      return project?.name || placeholder
    }
  }
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(date)
  }
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 50) return 'text-blue-600'
    if (progress >= 25) return 'text-yellow-600'
    return 'text-gray-600'
  }
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between',
            error && 'border-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="truncate">{getSelectedProjectsDisplay()}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg"
            style={{ maxHeight }}
          >
            <div className="p-3 space-y-3 border-b">
              {/* Search */}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un projet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}
              {/* Filters */}
              {filterable && (
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes</SelectItem>
                      {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {/* Projects List */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
                <div key={groupName}>
                  {groupBy && (
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                      {groupName}
                    </div>
                  )}
                  {groupProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        'flex items-start gap-3 px-3 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0',
                        selectedProjects.includes(project.id) && 'bg-blue-50'
                      )}
                      onClick={() => handleProjectToggle(project.id)}
                    >
                      <div className="flex items-center mt-0.5">
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center">
                          {selectedProjects.includes(project.id) && (
                            <Check className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{project.name}</span>
                              <span className="text-xs text-muted-foreground">({project.code})</span>
                            </div>
                            {project.description && (
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              className={cn('text-xs', STATUS_CONFIG[project.status].color)}
                              variant="secondary"
                            >
                              {STATUS_CONFIG[project.status].icon}
                              <span className="ml-1">{STATUS_CONFIG[project.status].label}</span>
                            </Badge>
                            <Badge 
                              className={cn('text-xs', PRIORITY_CONFIG[project.priority].color)}
                              variant="outline"
                            >
                              {PRIORITY_CONFIG[project.priority].label}
                            </Badge>
                          </div>
                        </div>
                        {/* Progress */}
                        {showProgress && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progression</span>
                              <span className={cn('font-medium', getProgressColor(project.progress))}>
                                {project.progress}%
                              </span>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>
                        )}
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Client & Manager */}
                          <div className="space-y-1">
                            {project.client && (
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {project.client.company || project.client.name}
                                </span>
                              </div>
                            )}
                            {showTeam && project.manager && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {project.manager.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            {/* Dates */}
                            {showDates && project.dates.endDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {formatDate(project.dates.endDate)}
                                </span>
                              </div>
                            )}
                            {/* Budget */}
                            {showBudget && project.budget && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {formatCurrency(project.budget.allocated, project.budget.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Location */}
                        {project.location && (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{project.location}</span>
                          </div>
                        )}
                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                +{project.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {filteredProjects.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun projet trouvé</p>
                </div>
              )}
            </div>
            {/* Create New Project */}
            {allowCreateNew && onCreateNew && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onCreateNew()
                    setIsOpen(false)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un nouveau projet
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
