'use client'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  MessageSquare,
  Paperclip,
  Play,
  Target,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../../../data-display/avatar/avatar'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'
export type MilestoneStatus = 'upcoming' | 'current' | 'completed' | 'overdue' | 'blocked'
export type MilestonePriority = 'low' | 'medium' | 'high' | 'critical'
export interface ProjectMilestone {
  id: string
  title: string
  description?: string
  status: MilestoneStatus
  priority: MilestonePriority
  startDate: Date
  dueDate: Date
  completedDate?: Date
  progress: number
  assignees: Array<{
    id: string
    name: string
    avatar?: string
    role?: string
  }>
  dependencies?: string[]
  deliverables?: Array<{
    name: string
    status: 'pending' | 'completed' | 'approved'
    url?: string
  }>
  comments?: number
  attachments?: number
  budget?: {
    allocated: number
    spent: number
    currency: string
  }
  risks?: Array<{
    description: string
    level: 'low' | 'medium' | 'high'
    mitigation?: string
  }>
  notes?: string
}
export interface ProjectTimelineProps {
  className?: string
  projectName: string
  projectDescription?: string
  startDate: Date
  endDate: Date
  currentDate?: Date
  milestones: ProjectMilestone[]
  totalBudget?: number
  spentBudget?: number
  currency?: string
  compact?: boolean
  showProgress?: boolean
  showDetails?: boolean
  showBudget?: boolean
  onMilestoneClick?: (milestoneId: string) => void
  onMilestoneAction?: (milestoneId: string, action: 'start' | 'complete' | 'edit') => void
}
const statusConfig = {
  upcoming: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Calendar,
    label: 'À venir',
    bgColor: 'bg-gray-50/30',
  },
  current: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    label: 'En cours',
    bgColor: 'bg-blue-50/50',
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Terminé',
    bgColor: 'bg-green-50/30',
  },
  overdue: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'En retard',
    bgColor: 'bg-red-50/30',
  },
  blocked: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: XCircle,
    label: 'Bloqué',
    bgColor: 'bg-orange-50/30',
  },
}
const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Basse', icon: Flag },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Moyenne', icon: Flag },
  high: { color: 'bg-orange-100 text-orange-800', label: 'Haute', icon: Flag },
  critical: { color: 'bg-red-100 text-red-800', label: 'Critique', icon: AlertTriangle },
}
export function ProjectTimeline({
  className,
  projectName,
  projectDescription,
  startDate,
  endDate,
  currentDate = new Date(),
  milestones,
  totalBudget,
  spentBudget,
  currency = 'EUR',
  compact = false,
  showProgress = true,
  showDetails = true,
  showBudget = false,
  onMilestoneClick,
  onMilestoneAction,
}: ProjectTimelineProps) {
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const totalMilestones = milestones.length
  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
  const overdueMilestones = milestones.filter((m) => m.status === 'overdue').length
  const blockedMilestones = milestones.filter((m) => m.status === 'blocked').length
  const currentMilestones = milestones.filter((m) => m.status === 'current').length
  const isProjectOverdue = currentDate > endDate
  const daysRemaining = Math.ceil(
    (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const budgetProgress = totalBudget && spentBudget ? (spentBudget / totalBudget) * 100 : 0
  if (compact) {
    return (
      <Card className={cn(className, isProjectOverdue && 'border-red-300')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {projectName}
                {isProjectOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedMilestones}/{totalMilestones} jalons •{' '}
                {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Terminé'}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={cn(
                  overallProgress === 100 && 'bg-green-100 text-green-800',
                  isProjectOverdue && 'bg-red-100 text-red-800'
                )}
              >
                {Math.round(overallProgress)}%
              </Badge>
              {overdueMilestones > 0 && (
                <div className="text-xs text-red-600 mt-1">{overdueMilestones} en retard</div>
              )}
            </div>
          </div>
          {showProgress && <Progress value={overallProgress} className="h-2" />}
        </CardHeader>
      </Card>
    )
  }
  return (
    <Card className={cn(className, isProjectOverdue && 'border-red-300')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {projectName}
              {isProjectOverdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
            </CardTitle>
            {projectDescription && (
              <p className="text-sm text-muted-foreground mt-1">{projectDescription}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Début: {startDate.toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Fin: {endDate.toLocaleDateString('fr-FR')}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1',
                  daysRemaining < 0 && 'text-red-600 font-medium'
                )}
              >
                <Clock className="h-4 w-4" />
                {daysRemaining > 0
                  ? `${daysRemaining} jours restants`
                  : `En retard de ${Math.abs(daysRemaining)} jours`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                overallProgress === 100 && 'bg-green-100 text-green-800',
                isProjectOverdue && 'bg-red-100 text-red-800'
              )}
            >
              {Math.round(overallProgress)}% terminé
            </Badge>
            <div className="space-y-1">
              {currentMilestones > 0 && (
                <div className="text-xs text-blue-600">
                  {currentMilestones} jalon{currentMilestones > 1 ? 's' : ''} en cours
                </div>
              )}
              {overdueMilestones > 0 && (
                <div className="text-xs text-red-600 font-medium">
                  {overdueMilestones} jalon{overdueMilestones > 1 ? 's' : ''} en retard
                </div>
              )}
              {blockedMilestones > 0 && (
                <div className="text-xs text-orange-600">
                  {blockedMilestones} jalon{blockedMilestones > 1 ? 's' : ''} bloqué
                  {blockedMilestones > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
        {showProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression du projet</span>
              <span className="text-sm text-muted-foreground">
                {completedMilestones}/{totalMilestones} jalons ({Math.round(overallProgress)}%)
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        )}
        {showBudget && totalBudget && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget</span>
              <span className="text-sm text-muted-foreground">
                {spentBudget?.toLocaleString('fr-FR')} / {totalBudget.toLocaleString('fr-FR')}{' '}
                {currency}
              </span>
            </div>
            <Progress
              value={budgetProgress}
              className={cn(
                'h-2',
                budgetProgress > 90 && 'progress-orange',
                budgetProgress > 100 && 'progress-red'
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(budgetProgress)}% du budget utilisé
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {milestones.map((milestone, index) => {
          const StatusIcon = statusConfig[milestone.status].icon
          const PriorityIcon = priorityConfig[milestone.priority].icon
          const isClickable =
            onMilestoneClick && (milestone.status === 'completed' || milestone.status === 'current')
          const _isOverdue = milestone.status === 'overdue'
          const _isBlocked = milestone.status === 'blocked'
          return (
            <div key={milestone.id} className="relative">
              {/* Connection line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200" />
              )}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: This div implements conditional click handling for milestone cards with complex nested interactive content. Using div is appropriate here for the card layout. */}
              <div
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border transition-all',
                  statusConfig[milestone.status].bgColor,
                  milestone.status === 'current' && 'border-blue-300',
                  milestone.status === 'completed' && 'border-green-300',
                  milestone.status === 'overdue' && 'border-red-300',
                  milestone.status === 'blocked' && 'border-orange-300',
                  milestone.status === 'upcoming' && 'border-gray-200',
                  isClickable && 'cursor-pointer hover:shadow-sm'
                )}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onMilestoneClick(milestone.id) : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onMilestoneClick(milestone.id)
                  }
                }}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2',
                    milestone.status === 'completed' &&
                      'bg-green-100 border-green-300 text-green-600',
                    milestone.status === 'current' && 'bg-blue-100 border-blue-300 text-blue-600',
                    milestone.status === 'overdue' && 'bg-red-100 border-red-300 text-red-600',
                    milestone.status === 'blocked' &&
                      'bg-orange-100 border-orange-300 text-orange-600',
                    milestone.status === 'upcoming' && 'bg-gray-100 border-gray-300 text-gray-600'
                  )}
                >
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                    <Badge variant="outline" className={statusConfig[milestone.status].color}>
                      {statusConfig[milestone.status].label}
                    </Badge>
                    <Badge variant="outline" className={priorityConfig[milestone.priority].color}>
                      <PriorityIcon className="h-3 w-3 mr-1" />
                      {priorityConfig[milestone.priority].label}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          Période: {milestone.startDate.toLocaleDateString('fr-FR')} -{' '}
                          {milestone.dueDate.toLocaleDateString('fr-FR')}
                        </div>
                        {milestone.completedDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Terminé le: {milestone.completedDate.toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      {milestone.progress > 0 && milestone.status !== 'completed' && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progression</span>
                            <span>{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {/* Assignees */}
                      {milestone.assignees.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            {milestone.assignees.length === 1 ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            Assigné{milestone.assignees.length > 1 ? 's' : ''}:
                          </div>
                          <div className="flex items-center gap-2">
                            {milestone.assignees.slice(0, 3).map((assignee) => (
                              <div key={assignee.id} className="flex items-center gap-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={assignee.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {assignee.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {assignee.name}
                                </span>
                              </div>
                            ))}
                            {milestone.assignees.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{milestone.assignees.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Budget */}
                      {showDetails && milestone.budget && (
                        <div className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Budget:</span>
                            <span
                              className={cn(
                                milestone.budget.spent > milestone.budget.allocated &&
                                  'text-red-600 font-medium'
                              )}
                            >
                              {milestone.budget.spent.toLocaleString('fr-FR')} /{' '}
                              {milestone.budget.allocated.toLocaleString('fr-FR')}{' '}
                              {milestone.budget.currency}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Deliverables */}
                  {showDetails && milestone.deliverables && milestone.deliverables.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Livrables
                      </h4>
                      <div className="space-y-1">
                        {milestone.deliverables.map((deliverable, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {deliverable.url && <Paperclip className="h-3 w-3" />}
                              {deliverable.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                deliverable.status === 'completed' && 'bg-green-100 text-green-800',
                                deliverable.status === 'approved' && 'bg-blue-100 text-blue-800',
                                deliverable.status === 'pending' && 'bg-yellow-100 text-yellow-800'
                              )}
                            >
                              {deliverable.status === 'pending' && 'En attente'}
                              {deliverable.status === 'completed' && 'Terminé'}
                              {deliverable.status === 'approved' && 'Approuvé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Dependencies */}
                  {showDetails && milestone.dependencies && milestone.dependencies.length > 0 && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Dépendances</h4>
                      <p className="text-xs text-yellow-700">
                        Dépend de: {milestone.dependencies.join(', ')}
                      </p>
                    </div>
                  )}
                  {/* Risks */}
                  {milestone.risks && milestone.risks.length > 0 && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Risques identifiés</h4>
                      {milestone.risks.map((risk, idx) => (
                        <div key={idx} className="text-sm text-red-700 mb-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                risk.level === 'high' && 'bg-red-100 text-red-800',
                                risk.level === 'medium' && 'bg-orange-100 text-orange-800',
                                risk.level === 'low' && 'bg-yellow-100 text-yellow-800'
                              )}
                            >
                              {risk.level}
                            </Badge>
                            <span>{risk.description}</span>
                          </div>
                          {risk.mitigation && (
                            <div className="text-xs text-gray-600 mt-1 ml-2">
                              Mitigation: {risk.mitigation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {milestone.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{milestone.notes}</p>
                    </div>
                  )}
                  {/* Activity indicators */}
                  {showDetails && (milestone.comments || milestone.attachments) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {milestone.comments && milestone.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {milestone.comments} commentaire{milestone.comments > 1 ? 's' : ''}
                        </div>
                      )}
                      {milestone.attachments && milestone.attachments > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {milestone.attachments} fichier{milestone.attachments > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Action buttons */}
                  {milestone.status === 'upcoming' && onMilestoneAction && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMilestoneAction(milestone.id, 'start')
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4 mr-1 inline" />
                        Démarrer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMilestoneAction(milestone.id, 'edit')
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                  {milestone.status === 'current' && onMilestoneAction && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMilestoneAction(milestone.id, 'complete')
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1 inline" />
                        Terminer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMilestoneAction(milestone.id, 'edit')
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {milestone.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {milestone.status === 'current' && (
                    <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                  )}
                  {milestone.status === 'overdue' && (
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  )}
                  {milestone.status === 'blocked' && (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                  {milestone.status === 'upcoming' && (
                    <Calendar className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
