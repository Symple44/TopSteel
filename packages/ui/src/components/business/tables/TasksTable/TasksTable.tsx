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
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  Flag
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
export interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assigneeName?: string
  assigneeAvatar?: string
  createdById: string
  createdByName: string
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type: 'task' | 'bug' | 'feature' | 'improvement' | 'research'
  dueDate?: Date
  startDate?: Date
  completedDate?: Date
  estimatedHours?: number
  actualHours?: number
  progress: number // 0-100
  tags?: string[]
  dependencies?: string[] // task IDs
  blockedBy?: string // task ID or reason
  attachments?: Array<{
    name: string
    url: string
    size: number
  }>
  comments?: number
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  createdAt: Date
  updatedAt: Date
}
interface TasksTableProps {
  data: Task[]
  loading?: boolean
  onView?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onStart?: (task: Task) => void
  onPause?: (task: Task) => void
  onComplete?: (task: Task) => void
  onAssign?: (task: Task) => void
  onComment?: (task: Task) => void
}
export function TasksTable({ 
  data = [], 
  loading = false, 
  onView,
  onEdit, 
  onDelete,
  onStart,
  onPause,
  onComplete,
  onAssign,
  onComment
}: TasksTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des tâches...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      todo: { 
        label: 'À faire', 
        className: 'bg-gray-100 text-gray-800',
        icon: <Clock className="h-3 w-3" />
      },
      in_progress: { 
        label: 'En cours', 
        className: 'bg-blue-100 text-blue-800',
        icon: <PlayCircle className="h-3 w-3" />
      },
      blocked: { 
        label: 'Bloqué', 
        className: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="h-3 w-3" />
      },
      review: { 
        label: 'En revue', 
        className: 'bg-purple-100 text-purple-800',
        icon: <Eye className="h-3 w-3" />
      },
      done: { 
        label: 'Terminé', 
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      cancelled: { 
        label: 'Annulé', 
        className: 'bg-gray-100 text-gray-600',
        icon: <PauseCircle className="h-3 w-3" />
      },
    }
    const variant = variants[status] || variants.todo
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getPriorityBadge = (priority: Task['priority']) => {
    const variants = {
      low: { 
        label: 'Faible', 
        className: 'bg-gray-100 text-gray-800',
        icon: null
      },
      medium: { 
        label: 'Moyen', 
        className: 'bg-blue-100 text-blue-800',
        icon: null
      },
      high: { 
        label: 'Élevé', 
        className: 'bg-orange-100 text-orange-800',
        icon: <Flag className="h-3 w-3" />
      },
      urgent: { 
        label: 'Urgent', 
        className: 'bg-red-100 text-red-800',
        icon: <Flag className="h-3 w-3" />
      },
    }
    const variant = variants[priority] || variants.medium
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getTypeBadge = (type: Task['type']) => {
    const variants = {
      task: { label: 'Tâche', variant: 'outline' as const },
      bug: { label: 'Bug', variant: 'destructive' as const },
      feature: { label: 'Fonctionnalité', variant: 'default' as const },
      improvement: { label: 'Amélioration', variant: 'secondary' as const },
      research: { label: 'Recherche', variant: 'outline' as const },
    }
    const variant = variants[type] || variants.task
    return <Badge variant={variant.variant}>{variant.label}</Badge>
  }
  const formatDate = (date?: Date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  const getDaysUntilDue = (dueDate?: Date) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const getSubtaskProgress = (subtasks?: Task['subtasks']) => {
    if (!subtasks || subtasks.length === 0) return null
    const completed = subtasks.filter(st => st.completed).length
    return `${completed}/${subtasks.length}`
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tâche</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Assigné à</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Temps</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                Aucune tâche trouvée
              </TableCell>
            </TableRow>
          ) : (
            data.map((task) => {
              const daysUntilDue = getDaysUntilDue(task.dueDate)
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && task.status !== 'done'
              const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0 && task.status !== 'done'
              const subtaskProgress = getSubtaskProgress(task.subtasks)
              return (
                <TableRow 
                  key={task.id}
                  className={task.status === 'cancelled' ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.blockedBy && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Bloqué
                          </Badge>
                        )}
                        {task.comments && task.comments > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {task.comments}
                          </div>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            {task.attachments.length}
                          </div>
                        )}
                        {subtaskProgress && (
                          <div className="text-xs text-muted-foreground">
                            Sous-tâches: {subtaskProgress}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.projectName || '-'}
                  </TableCell>
                  <TableCell>
                    {task.assigneeName ? (
                      <div className="flex items-center gap-2">
                        {task.assigneeAvatar ? (
                          <img 
                            src={task.assigneeAvatar} 
                            alt={task.assigneeName}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                        )}
                        <span className="text-sm">{task.assigneeName}</span>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onAssign?.(task)}
                        className="text-blue-600"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Assigner
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{getTypeBadge(task.type)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={task.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {task.progress}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className={isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : ''}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">{formatDate(task.dueDate)}</span>
                        </div>
                        {daysUntilDue !== null && (
                          <div className="text-xs">
                            {daysUntilDue > 0 ? (
                              <span className={isDueSoon ? 'font-medium' : 'text-muted-foreground'}>
                                {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''}
                              </span>
                            ) : daysUntilDue === 0 ? (
                              <span className="font-medium">Aujourd'hui</span>
                            ) : (
                              <span className="font-medium">
                                {Math.abs(daysUntilDue)} jour{Math.abs(daysUntilDue) > 1 ? 's' : ''} de retard
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {task.estimatedHours ? (
                      <div className="text-sm">
                        <div>{task.actualHours || 0}h / {task.estimatedHours}h</div>
                        {task.actualHours && task.actualHours > task.estimatedHours && (
                          <div className="text-xs text-red-600">
                            +{task.actualHours - task.estimatedHours}h
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
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
                        <DropdownMenuItem onClick={() => onView?.(task)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {task.status === 'todo' && (
                          <DropdownMenuItem 
                            onClick={() => onStart?.(task)}
                            className="text-blue-600"
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Démarrer
                          </DropdownMenuItem>
                        )}
                        {task.status === 'in_progress' && (
                          <DropdownMenuItem 
                            onClick={() => onPause?.(task)}
                            className="text-orange-600"
                          >
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Mettre en pause
                          </DropdownMenuItem>
                        )}
                        {(task.status === 'in_progress' || task.status === 'review') && (
                          <DropdownMenuItem 
                            onClick={() => onComplete?.(task)}
                            className="text-green-600"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Terminer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onComment?.(task)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Commenter
                        </DropdownMenuItem>
                        {!task.assigneeId && (
                          <DropdownMenuItem onClick={() => onAssign?.(task)}>
                            <User className="mr-2 h-4 w-4" />
                            Assigner
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(task)}
                          className="text-red-600"
                          disabled={task.status === 'done'}
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
