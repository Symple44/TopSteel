'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../data-display'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../primitives'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Archive,
  FileText,
  BarChart3
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
import { Progress } from '../../../primitives'
export interface Project {
  id: string
  code: string
  name: string
  description?: string
  clientId: string
  clientName: string
  managerId: string
  managerName: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'fixed_price' | 'time_material' | 'maintenance' | 'internal' | 'research'
  startDate: Date
  endDate: Date
  actualEndDate?: Date
  budget: number
  spent: number
  currency: string
  progress: number // 0-100
  health: 'good' | 'at_risk' | 'critical'
  team: Array<{
    id: string
    name: string
    role: string
    avatar?: string
  }>
  milestones: Array<{
    id: string
    name: string
    dueDate: Date
    completed: boolean
  }>
  tasksCount: {
    total: number
    completed: number
    inProgress: number
    todo: number
  }
  documentsCount: number
  lastActivityDate?: Date
  risks?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}
interface ProjectsTableProps {
  data: Project[]
  loading?: boolean
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onArchive?: (project: Project) => void
  onViewTasks?: (project: Project) => void
  onViewDocuments?: (project: Project) => void
  onViewReports?: (project: Project) => void
  onManageTeam?: (project: Project) => void
}
export function ProjectsTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onViewTasks,
  onViewDocuments,
  onViewReports,
  onManageTeam,
}: ProjectsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Project['status']) => {
    const variants = {
      planning: { 
        label: 'Planification', 
        className: 'bg-gray-100 text-gray-800',
        icon: <Clock className="h-3 w-3" />
      },
      active: { 
        label: 'Actif', 
        className: 'bg-blue-100 text-blue-800',
        icon: <PlayCircle className="h-3 w-3" />
      },
      on_hold: { 
        label: 'En pause', 
        className: 'bg-yellow-100 text-yellow-800',
        icon: <PauseCircle className="h-3 w-3" />
      },
      completed: { 
        label: 'Terminé', 
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      cancelled: { 
        label: 'Annulé', 
        className: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="h-3 w-3" />
      },
      archived: { 
        label: 'Archivé', 
        className: 'bg-gray-100 text-gray-600',
        icon: <Archive className="h-3 w-3" />
      },
    }
    const variant = variants[status] || variants.planning
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getPriorityBadge = (priority: Project['priority']) => {
    const variants = {
      low: { label: 'Faible', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Moyen', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Élevé', className: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Critique', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[priority] || variants.medium
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const getHealthIndicator = (health: Project['health']) => {
    const variants = {
      good: { 
        label: 'Bon', 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <CheckCircle className="h-4 w-4" />
      },
      at_risk: { 
        label: 'À risque', 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: <AlertCircle className="h-4 w-4" />
      },
      critical: { 
        label: 'Critique', 
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: <AlertCircle className="h-4 w-4" />
      },
    }
    const variant = variants[health] || variants.good
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${variant.bgColor}`}>
        <span className={variant.color}>{variant.icon}</span>
        <span className={`text-sm font-medium ${variant.color}`}>{variant.label}</span>
      </div>
    )
  }
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  const getDaysRemaining = (endDate: Date) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const getBudgetStatus = (budget: number, spent: number) => {
    const percentage = (spent / budget) * 100
    if (percentage > 90) return 'text-red-600'
    if (percentage > 75) return 'text-orange-600'
    return 'text-green-600'
  }
  const getMilestoneProgress = (milestones: Project['milestones']) => {
    if (!milestones || milestones.length === 0) return null
    const completed = milestones.filter(m => m.completed).length
    return `${completed}/${milestones.length}`
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projet</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Chef de projet</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Santé</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Tâches</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                Aucun projet trouvé
              </TableCell>
            </TableRow>
          ) : (
            data.map((project) => {
              const daysRemaining = getDaysRemaining(project.endDate)
              const isOverdue = daysRemaining < 0 && project.status === 'active'
              const milestoneProgress = getMilestoneProgress(project.milestones)
              const budgetStatus = getBudgetStatus(project.budget, project.spent)
              return (
                <TableRow 
                  key={project.id}
                  className={project.status === 'cancelled' || project.status === 'archived' ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.code}</div>
                      <div className="text-sm font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      )}
                      {getPriorityBadge(project.priority)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{project.clientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{project.managerName}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{getHealthIndicator(project.health)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={project.progress} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{project.progress}%</span>
                        {milestoneProgress && (
                          <span className="text-muted-foreground">
                            Jalons: {milestoneProgress}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className={`font-medium ${budgetStatus}`}>
                        {formatCurrency(project.spent, project.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        / {formatCurrency(project.budget, project.currency)}
                      </div>
                      <Progress 
                        value={(project.spent / project.budget) * 100} 
                        className="h-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(project.startDate)}</div>
                      <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(project.endDate)}
                      </div>
                      {project.status === 'active' && (
                        <div className="text-xs">
                          {daysRemaining > 0 ? (
                            <span className="text-muted-foreground">
                              {daysRemaining} jours restants
                            </span>
                          ) : daysRemaining === 0 ? (
                            <span className="text-orange-600">Termine aujourd'hui</span>
                          ) : (
                            <span className="text-red-600">
                              {Math.abs(daysRemaining)} jours de retard
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {project.tasksCount.completed}/{project.tasksCount.total}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        En cours: {project.tasksCount.inProgress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                          title={`${member.name} - ${member.role}`}
                        >
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="h-full w-full rounded-full"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {member.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      ))}
                      {project.team.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium">+{project.team.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView?.(project)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewTasks?.(project)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Voir les tâches
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageTeam?.(project)}>
                          <Users className="mr-2 h-4 w-4" />
                          Gérer l'équipe
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDocuments?.(project)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Documents ({project.documentsCount})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewReports?.(project)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Rapports
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {project.status !== 'archived' && (
                          <DropdownMenuItem 
                            onClick={() => onArchive?.(project)}
                            className="text-orange-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(project)}
                          className="text-red-600"
                          disabled={project.status === 'active'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
