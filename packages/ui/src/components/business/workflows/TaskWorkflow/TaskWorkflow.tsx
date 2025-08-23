'use client'
import React, { useState } from 'react'
import { Badge } from '../../../data-display/badge'
import { Button } from '../../../primitives/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../data-display/avatar/avatar'
import { Progress } from '../../../data-display/progress/progress'
import { cn } from '../../../../lib/utils'
import { 
  CheckSquare, 
  Square,
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Users,
  MessageSquare,
  Paperclip,
  Flag,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle2,
  Timer,
  Tag
} from 'lucide-react'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export interface TaskItem {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
  reporter?: {
    id: string
    name: string
    avatar?: string
  }
  dueDate?: Date
  createdAt: Date
  updatedAt?: Date
  completedAt?: Date
  estimatedHours?: number
  loggedHours?: number
  tags?: string[]
  attachments?: number
  comments?: number
  dependencies?: string[]
  subtasks?: TaskItem[]
  blockedReason?: string
  storyPoints?: number
}
export interface TaskWorkflowProps {
  className?: string
  title?: string
  tasks: TaskItem[]
  columns?: Array<{
    id: TaskStatus
    title: string
    limit?: number
  }>
  view?: 'kanban' | 'list' | 'timeline'
  allowDragDrop?: boolean
  showFilters?: boolean
  showMetrics?: boolean
  onTaskClick?: (taskId: string) => void
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  onTaskEdit?: (taskId: string) => void
  onTaskDelete?: (taskId: string) => void
  onTaskAssign?: (taskId: string, assigneeId: string) => void
  onAddTask?: (status: TaskStatus) => void
}
const statusConfig = {
  todo: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Square,
    label: 'À faire',
    bgColor: 'bg-gray-50'
  },
  in_progress: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    label: 'En cours',
    bgColor: 'bg-blue-50'
  },
  review: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Eye,
    label: 'Révision',
    bgColor: 'bg-purple-50'
  },
  done: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckSquare,
    label: 'Terminé',
    bgColor: 'bg-green-50'
  },
  blocked: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'Bloqué',
    bgColor: 'bg-red-50'
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Trash2,
    label: 'Annulé',
    bgColor: 'bg-gray-50'
  }
}
const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Basse', icon: Flag },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Moyenne', icon: Flag },
  high: { color: 'bg-orange-100 text-orange-800', label: 'Haute', icon: Flag },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent', icon: AlertTriangle }
}
const defaultColumns: Array<{ id: TaskStatus; title: string; limit?: number }> = [
  { id: 'todo', title: 'À faire' },
  { id: 'in_progress', title: 'En cours', limit: 3 },
  { id: 'review', title: 'Révision' },
  { id: 'done', title: 'Terminé' }
]
export function TaskWorkflow({
  className,
  title = "Workflow des tâches",
  tasks,
  columns = defaultColumns,
  view = 'kanban',
  allowDragDrop = false,
  showFilters = true,
  showMetrics = true,
  onTaskClick,
  onTaskStatusChange,
  onTaskEdit,
  onTaskDelete,
  onTaskAssign,
  onAddTask
}: TaskWorkflowProps) {
  const [selectedFilters, setSelectedFilters] = useState<{
    priority?: TaskPriority[]
    assignee?: string[]
    tags?: string[]
  }>({})
  const filteredTasks = tasks.filter(task => {
    if (selectedFilters.priority && selectedFilters.priority.length > 0) {
      if (!selectedFilters.priority.includes(task.priority)) return false
    }
    if (selectedFilters.assignee && selectedFilters.assignee.length > 0) {
      if (!task.assignee || !selectedFilters.assignee.includes(task.assignee.id)) return false
    }
    if (selectedFilters.tags && selectedFilters.tags.length > 0) {
      if (!task.tags || !selectedFilters.tags.some(tag => task.tags!.includes(tag))) return false
    }
    return true
  })
  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status)
  }
  const getTaskMetrics = () => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.status === 'done').length
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length
    const blocked = filteredTasks.filter(t => t.status === 'blocked').length
    const overdue = filteredTasks.filter(t => 
      t.dueDate && new Date() > t.dueDate && t.status !== 'done'
    ).length
    return { total, completed, inProgress, blocked, overdue }
  }
  const metrics = getTaskMetrics()
  const progressPercentage = metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0
  const isTaskOverdue = (task: TaskItem) => {
    return task.dueDate && new Date() > task.dueDate && task.status !== 'done'
  }
  const TaskCard = ({ task }: { task: TaskItem }) => {
    const StatusIcon = statusConfig[task.status].icon
    const PriorityIcon = priorityConfig[task.priority].icon
    const isOverdue = isTaskOverdue(task)
    return (
      <div 
        className={cn(
          "p-3 bg-white border rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md",
          isOverdue && "border-red-300 bg-red-50/30",
          task.status === 'blocked' && "border-orange-300 bg-orange-50/30"
        )}
        onClick={() => onTaskClick?.(task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn(
              "h-4 w-4",
              task.status === 'done' && "text-green-600",
              task.status === 'in_progress' && "text-blue-600",
              task.status === 'blocked' && "text-red-600"
            )} />
            <Badge 
              variant="outline" 
              className={cn("text-xs", priorityConfig[task.priority].color)}
            >
              {priorityConfig[task.priority].label}
            </Badge>
            {isOverdue && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                En retard
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onTaskEdit?.(task.id)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {task.comments && task.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments}
                </div>
              )}
              {task.attachments && task.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments}
                </div>
              )}
            </div>
          </div>
          {task.dueDate && (
            <div className={cn(
              "text-xs flex items-center gap-1",
              isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              {task.dueDate.toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
        {task.estimatedHours && (
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Estimé: {task.estimatedHours}h
            </div>
            {task.loggedHours && (
              <div>Réalisé: {task.loggedHours}h</div>
            )}
          </div>
        )}
        {task.blockedReason && task.status === 'blocked' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {task.blockedReason}
          </div>
        )}
      </div>
    )
  }
  if (view === 'list') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {showMetrics && (
              <div className="flex items-center gap-4 text-sm">
                <span>{metrics.completed}/{metrics.total} terminées</span>
                <Badge variant="outline">{Math.round(progressPercentage)}%</Badge>
              </div>
            )}
          </div>
          {showMetrics && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => onTaskStatusChange?.(task.id, task.status === 'done' ? 'todo' : 'done')}
                    className="rounded"
                  />
                  <Badge variant="outline" className={statusConfig[task.status].color}>
                    {statusConfig[task.status].label}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    <Badge variant="outline" className={priorityConfig[task.priority].color}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {task.assignee && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {task.dueDate && (
                    <span className={cn(
                      "text-xs",
                      isTaskOverdue(task) ? "text-red-600 font-medium" : "text-muted-foreground"
                    )}>
                      {task.dueDate.toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  // Kanban view (default)
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showMetrics && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Progression:</span>
                <Badge variant="outline">{Math.round(progressPercentage)}%</Badge>
              </div>
              {metrics.blocked > 0 && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {metrics.blocked} bloquée{metrics.blocked > 1 ? 's' : ''}
                </Badge>
              )}
              {metrics.overdue > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {metrics.overdue} en retard
                </Badge>
              )}
            </div>
          )}
        </div>
        {showMetrics && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
              <div className="text-xs text-muted-foreground">Terminées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.blocked}</div>
              <div className="text-xs text-muted-foreground">Bloquées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.overdue}</div>
              <div className="text-xs text-muted-foreground">En retard</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id)
            const isOverLimit = column.limit && columnTasks.length > column.limit
            return (
              <div key={column.id} className="flex flex-col">
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-t-lg border-b",
                  statusConfig[column.id].bgColor
                )}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{column.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                    {isOverLimit && (
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                        Limite dépassée
                      </Badge>
                    )}
                  </div>
                  {onAddTask && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onAddTask(column.id)}
                    >
                      +
                    </Button>
                  )}
                </div>
                <div className={cn(
                  "flex-1 p-3 space-y-3 min-h-32 rounded-b-lg border border-t-0",
                  statusConfig[column.id].bgColor,
                  isOverLimit && "border-red-300"
                )}>
                  {columnTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
