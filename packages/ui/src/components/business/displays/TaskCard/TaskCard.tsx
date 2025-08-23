'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { 
  Clock,
  Calendar,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Flag,
  FileText,
  MessageSquare,
  Paperclip,
  Target,
  Timer,
  Edit3,
  Eye,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type: 'production' | 'quality' | 'maintenance' | 'delivery' | 'administrative' | 'safety'
  assignee: {
    id: string
    name: string
    avatar?: string
    role?: string
  }
  reporter?: {
    id: string
    name: string
  }
  dates: {
    created: Date
    updated: Date
    dueDate?: Date
    startDate?: Date
    completedDate?: Date
  }
  project?: {
    id: string
    name: string
    code?: string
  }
  estimatedHours?: number
  actualHours?: number
  progress: number // percentage 0-100
  tags: string[]
  attachments?: Array<{
    id: string
    name: string
    size: number
    type: string
    url: string
  }>
  comments: Array<{
    id: string
    author: {
      id: string
      name: string
      avatar?: string
    }
    content: string
    createdAt: Date
  }>
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  dependencies?: Array<{
    id: string
    title: string
    status: string
  }>
  watchers: Array<{
    id: string
    name: string
    avatar?: string
  }>
}
interface TaskCardProps {
  task: Task
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  onAssign?: () => void
  onComment?: () => void
  onStatusChange?: (status: Task['status']) => void
  className?: string
  loading?: boolean
  compact?: boolean
}
export function TaskCard({
  task,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  onAssign,
  onComment,
  onStatusChange,
  className,
  loading = false,
  compact = false,
}: TaskCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded w-16" />
              <div className="h-6 bg-muted rounded w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return {
          label: 'À faire',
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          color: 'text-gray-600'
        }
      case 'in_progress':
        return {
          label: 'En cours',
          icon: Play,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          color: 'text-blue-600'
        }
      case 'review':
        return {
          label: 'En révision',
          icon: Eye,
          className: 'bg-purple-100 text-purple-800 border-purple-200',
          color: 'text-purple-600'
        }
      case 'completed':
        return {
          label: 'Terminée',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
          color: 'text-green-600'
        }
      case 'cancelled':
        return {
          label: 'Annulée',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-900 border-red-300',
          color: 'text-red-600'
        }
      case 'blocked':
        return {
          label: 'Bloquée',
          icon: Pause,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          color: 'text-orange-600'
        }
      default:
        return {
          label: 'Inconnu',
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          color: 'text-gray-600'
        }
    }
  }
  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          icon: Flag,
          className: 'bg-red-100 text-red-800 border-red-200',
          color: 'text-red-600'
        }
      case 'high':
        return {
          label: 'Haute',
          icon: Flag,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          color: 'text-orange-600'
        }
      case 'medium':
        return {
          label: 'Moyenne',
          icon: Flag,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          color: 'text-yellow-600'
        }
      case 'low':
        return {
          label: 'Faible',
          icon: Flag,
          className: 'bg-green-100 text-green-800 border-green-200',
          color: 'text-green-600'
        }
      default:
        return {
          label: 'Non définie',
          icon: Flag,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          color: 'text-gray-600'
        }
    }
  }
  const getTypeLabel = (type: Task['type']) => {
    switch (type) {
      case 'production':
        return 'Production'
      case 'quality':
        return 'Qualité'
      case 'maintenance':
        return 'Maintenance'
      case 'delivery':
        return 'Livraison'
      case 'administrative':
        return 'Administratif'
      case 'safety':
        return 'Sécurité'
      default:
        return 'Autre'
    }
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }
  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) {
      return { label: `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`, color: 'text-red-600' }
    } else if (days === 0) {
      return { label: 'Échéance aujourd\'hui', color: 'text-orange-600' }
    } else if (days === 1) {
      return { label: 'Échéance demain', color: 'text-yellow-600' }
    } else if (days <= 7) {
      return { label: `${days} jours restants`, color: 'text-yellow-600' }
    } else {
      return { label: `${days} jours restants`, color: 'text-green-600' }
    }
  }
  const getCompletedSubtasks = () => {
    if (!task.subtasks) return { completed: 0, total: 0 }
    const completed = task.subtasks.filter(st => st.completed).length
    return { completed, total: task.subtasks.length }
  }
  const getUnblockedDependencies = () => {
    if (!task.dependencies) return { completed: 0, total: 0 }
    const completed = task.dependencies.filter(dep => dep.status === 'completed').length
    return { completed, total: task.dependencies.length }
  }
  const statusConfig = getStatusConfig(task.status)
  const priorityConfig = getPriorityConfig(task.priority)
  const StatusIcon = statusConfig.icon
  const PriorityIcon = priorityConfig.icon
  const timeRemaining = task.dates.dueDate ? getTimeRemaining(task.dates.dueDate) : null
  const subtasksInfo = getCompletedSubtasks()
  const dependenciesInfo = getUnblockedDependencies()
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={statusConfig.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.className}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priorityConfig.label}
              </Badge>
            </div>
            <CardTitle className="text-lg truncate">
              {task.title}
            </CardTitle>
            {task.project && (
              <p className="text-sm text-muted-foreground">
                {task.project.name}
                {task.project.code && ` (${task.project.code})`}
              </p>
            )}
          </div>
          {/* Assignee Avatar */}
          <div className="flex items-center gap-2 ml-3">
            {task.assignee.avatar ? (
              <img 
                src={task.assignee.avatar} 
                alt={task.assignee.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {task.description && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        {/* Progress Bar */}
        {task.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  task.progress === 100 ? 'bg-green-500' : statusConfig.color.replace('text-', 'bg-').replace('-600', '-500')
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
        {/* Dates and Times */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Assigné à</p>
            <div className="flex items-center gap-1">
              <span className="font-medium">{task.assignee.name}</span>
              {task.assignee.role && (
                <span className="text-xs text-muted-foreground">({task.assignee.role})</span>
              )}
            </div>
          </div>
          {task.dates.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground">Échéance</p>
              <div className="flex flex-col">
                <span className="font-medium">{formatDate(task.dates.dueDate)}</span>
                {timeRemaining && (
                  <span className={cn('text-xs', timeRemaining.color)}>
                    {timeRemaining.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        {!compact && (
          <>
            {/* Time Tracking */}
            {(task.estimatedHours || task.actualHours) && (
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                {task.estimatedHours && (
                  <div>
                    <p className="text-xs text-muted-foreground">Temps estimé</p>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{task.estimatedHours}h</span>
                    </div>
                  </div>
                )}
                {task.actualHours && (
                  <div>
                    <p className="text-xs text-muted-foreground">Temps passé</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{task.actualHours}h</span>
                      {task.estimatedHours && task.actualHours > task.estimatedHours && (
                        <span className="text-xs text-red-600">
                          (+{(task.actualHours - task.estimatedHours).toFixed(1)}h)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Subtasks and Dependencies */}
            {(subtasksInfo.total > 0 || dependenciesInfo.total > 0) && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {subtasksInfo.total > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Sous-tâches</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {subtasksInfo.completed}/{subtasksInfo.total}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({((subtasksInfo.completed / subtasksInfo.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
                {dependenciesInfo.total > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dépendances</p>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {dependenciesInfo.completed}/{dependenciesInfo.total}
                      </span>
                      {dependenciesInfo.completed < dependenciesInfo.total && (
                        <span className="text-xs text-red-600">Bloquée</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Type & Tags</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(task.type)}
                  </Badge>
                  {task.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {/* Attachments and Comments */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-4">
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.attachments.length} fichier{task.attachments.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {task.comments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments.length} commentaire{task.comments.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {task.watchers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{task.watchers.length} observateur{task.watchers.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div>
                Mis à jour: {formatDateTime(task.dates.updated)}
              </div>
            </div>
          </>
        )}
        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Détails
              </Button>
            )}
            {onStatusChange && task.status !== 'completed' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStatusChange(task.status === 'todo' ? 'in_progress' : 'completed')}
                className="flex items-center gap-1"
              >
                {task.status === 'todo' ? (
                  <>
                    <Play className="h-3 w-3" />
                    Démarrer
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Terminer
                  </>
                )}
              </Button>
            )}
            {onComment && (
              <Button variant="outline" size="sm" onClick={onComment} className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Commenter
              </Button>
            )}
            {onAssign && (
              <Button variant="outline" size="sm" onClick={onAssign} className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Réassigner
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1">
                <Edit3 className="h-3 w-3" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
