'use client'
import React, { useState } from 'react'
import { Badge } from '../../../data-display/badge'
import { Button } from '../../../primitives/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../data-display/avatar/avatar'
import { Progress } from '../../../data-display/progress/progress'
import { cn } from '../../../../lib/utils'
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Users, 
  MessageSquare,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'reviewing' | 'escalated'
export interface ApprovalStep {
  id: string
  title: string
  description?: string
  status: ApprovalStatus
  approver: {
    id: string
    name: string
    role: string
    avatar?: string
  }
  approvedAt?: Date
  rejectedAt?: Date
  comments?: string
  requiredApprovals?: number
  currentApprovals?: number
  deadline?: Date
  escalationLevel?: number
}
export interface ApprovalWorkflowProps {
  className?: string
  steps: ApprovalStep[]
  title?: string
  description?: string
  onApprove?: (stepId: string, comments?: string) => void
  onReject?: (stepId: string, comments: string) => void
  onComment?: (stepId: string, comment: string) => void
  onEscalate?: (stepId: string) => void
  allowComments?: boolean
  compact?: boolean
  showProgress?: boolean
}
const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'En attente'
  },
  reviewing: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
    label: 'En révision'
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Approuvé'
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejeté'
  },
  escalated: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
    label: 'Escaladé'
  }
}
export function ApprovalWorkflow({ 
  className, 
  steps, 
  title = "Processus d'approbation",
  description,
  onApprove,
  onReject,
  onComment,
  onEscalate,
  allowComments = true,
  compact = false,
  showProgress = true
}: ApprovalWorkflowProps) {
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [showCommentBox, setShowCommentBox] = useState<Record<string, boolean>>({})
  const totalSteps = steps.length
  const completedSteps = steps.filter(step => 
    step.status === 'approved' || step.status === 'rejected'
  ).length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => 
      step.status === 'pending' || step.status === 'reviewing'
    )
  }
  const currentStepIndex = getCurrentStepIndex()
  const isDeadlineApproaching = (deadline?: Date) => {
    if (!deadline) return false
    const now = new Date()
    const timeUntilDeadline = deadline.getTime() - now.getTime()
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60)
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0
  }
  const isDeadlineOverdue = (deadline?: Date) => {
    if (!deadline) return false
    return new Date() > deadline
  }
  const handleApprove = (stepId: string) => {
    const comments = commentText[stepId]
    onApprove?.(stepId, comments)
    setCommentText(prev => ({ ...prev, [stepId]: '' }))
    setShowCommentBox(prev => ({ ...prev, [stepId]: false }))
  }
  const handleReject = (stepId: string) => {
    const comments = commentText[stepId]
    if (!comments?.trim()) return
    onReject?.(stepId, comments)
    setCommentText(prev => ({ ...prev, [stepId]: '' }))
    setShowCommentBox(prev => ({ ...prev, [stepId]: false }))
  }
  const handleComment = (stepId: string) => {
    const comments = commentText[stepId]
    if (!comments?.trim()) return
    onComment?.(stepId, comments)
    setCommentText(prev => ({ ...prev, [stepId]: '' }))
    setShowCommentBox(prev => ({ ...prev, [stepId]: false }))
  }
  const toggleCommentBox = (stepId: string) => {
    setShowCommentBox(prev => ({ ...prev, [stepId]: !prev[stepId] }))
  }
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {showProgress && (
              <Badge variant="outline" className="text-xs">
                {completedSteps}/{totalSteps} étapes
              </Badge>
            )}
          </div>
          {showProgress && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step, index) => {
            const StatusIcon = statusConfig[step.status].icon
            const isCurrentStep = index === currentStepIndex
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border",
                  isCurrentStep && "bg-blue-50 border-blue-200",
                  !isCurrentStep && "border-gray-100"
                )}
              >
                <StatusIcon className={cn(
                  "h-4 w-4",
                  step.status === 'approved' && "text-green-600",
                  step.status === 'rejected' && "text-red-600",
                  step.status === 'pending' && "text-yellow-600",
                  step.status === 'reviewing' && "text-blue-600",
                  step.status === 'escalated' && "text-orange-600"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.approver.name}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", statusConfig[step.status].color)}
                >
                  {statusConfig[step.status].label}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Badge variant="outline">
            {completedSteps}/{totalSteps} étapes complétées
          </Badge>
        </div>
        {showProgress && (
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">
              Progression globale: {Math.round(progressPercentage)}%
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {steps.map((step, index) => {
          const StatusIcon = statusConfig[step.status].icon
          const isCurrentStep = index === currentStepIndex
          const isDeadlineNear = isDeadlineApproaching(step.deadline)
          const isOverdue = isDeadlineOverdue(step.deadline)
          return (
            <div key={step.id} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
              )}
              <div className={cn(
                "relative bg-white border rounded-lg p-4 transition-all",
                isCurrentStep && "border-blue-300 shadow-sm bg-blue-50/50",
                step.status === 'approved' && "border-green-300 bg-green-50/30",
                step.status === 'rejected' && "border-red-300 bg-red-50/30",
                step.status === 'escalated' && "border-orange-300 bg-orange-50/30",
                isOverdue && "border-red-400 bg-red-50"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2",
                    step.status === 'approved' && "bg-green-100 border-green-300",
                    step.status === 'rejected' && "bg-red-100 border-red-300",
                    step.status === 'pending' && "bg-yellow-100 border-yellow-300",
                    step.status === 'reviewing' && "bg-blue-100 border-blue-300",
                    step.status === 'escalated' && "bg-orange-100 border-orange-300"
                  )}>
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[step.status].color}
                      >
                        {statusConfig[step.status].label}
                      </Badge>
                      {step.escalationLevel && step.escalationLevel > 0 && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          Niveau {step.escalationLevel}
                        </Badge>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                    )}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={step.approver.avatar} />
                          <AvatarFallback>
                            {step.approver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{step.approver.name}</p>
                          <p className="text-xs text-muted-foreground">{step.approver.role}</p>
                        </div>
                      </div>
                      {step.requiredApprovals && step.requiredApprovals > 1 && (
                        <div className="text-sm text-muted-foreground">
                          {step.currentApprovals || 0}/{step.requiredApprovals} approbations requises
                        </div>
                      )}
                    </div>
                    {step.deadline && (
                      <div className={cn(
                        "text-sm mb-3",
                        isOverdue && "text-red-600 font-medium",
                        isDeadlineNear && !isOverdue && "text-orange-600 font-medium",
                        !isDeadlineNear && !isOverdue && "text-muted-foreground"
                      )}>
                        Échéance: {step.deadline.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {isOverdue && " (En retard)"}
                        {isDeadlineNear && !isOverdue && " (Échéance proche)"}
                      </div>
                    )}
                    {step.comments && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Commentaires</span>
                        </div>
                        <p className="text-sm text-gray-700">{step.comments}</p>
                      </div>
                    )}
                    {/* Action buttons for current step */}
                    {(step.status === 'pending' || step.status === 'reviewing') && (
                      <div className="flex gap-2 flex-wrap">
                        {onApprove && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(step.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => toggleCommentBox(step.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        )}
                        {allowComments && onComment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCommentBox(step.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Commenter
                          </Button>
                        )}
                        {onEscalate && step.deadline && isOverdue && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEscalate(step.id)}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Escalader
                          </Button>
                        )}
                      </div>
                    )}
                    {/* Comment box */}
                    {showCommentBox[step.id] && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                        <textarea
                          className="w-full p-2 border rounded-md text-sm resize-none"
                          rows={3}
                          placeholder="Ajoutez un commentaire..."
                          value={commentText[step.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ 
                            ...prev, 
                            [step.id]: e.target.value 
                          }))}
                        />
                        <div className="flex gap-2 mt-2">
                          {onReject && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(step.id)}
                              disabled={!commentText[step.id]?.trim()}
                            >
                              Rejeter avec commentaire
                            </Button>
                          )}
                          {onComment && (
                            <Button
                              size="sm"
                              onClick={() => handleComment(step.id)}
                              disabled={!commentText[step.id]?.trim()}
                            >
                              Ajouter commentaire
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCommentBox(step.id)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground mt-3">
                      {step.approvedAt && (
                        <span>Approuvé le {step.approvedAt.toLocaleDateString('fr-FR')}</span>
                      )}
                      {step.rejectedAt && (
                        <span>Rejeté le {step.rejectedAt.toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                  {/* Next step indicator */}
                  {index < steps.length - 1 && step.status === 'approved' && (
                    <div className="flex-shrink-0">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
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
