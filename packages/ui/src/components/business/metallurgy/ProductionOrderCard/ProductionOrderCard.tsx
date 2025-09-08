'use client'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Factory,
  Package,
  Pause,
  Play,
  Square,
  User,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Progress } from '../../../primitives/progress'

interface ProductionStep {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'paused'
  machine?: string
  operator?: string
  estimatedDuration: number // minutes
  actualDuration?: number
  startTime?: Date
  completedTime?: Date
}
interface Material {
  id: string
  name: string
  grade: string
  quantity: number
  unit: string
  allocated: boolean
}
interface ProductionOrder {
  id: string
  orderNumber: string
  productName: string
  description?: string
  quantity: number
  unit: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'planned' | 'in-progress' | 'paused' | 'completed' | 'cancelled'
  customer?: string
  dueDate: Date
  startDate?: Date
  completedDate?: Date
  materials: Material[]
  steps: ProductionStep[]
  progress: number
  estimatedCompletionTime?: Date
  notes?: string
}
interface ProductionOrderCardProps {
  order: ProductionOrder
  compact?: boolean
  showActions?: boolean
  showProgress?: boolean
  onEdit?: (order: ProductionOrder) => void
  onDelete?: (order: ProductionOrder) => void
  onStart?: (order: ProductionOrder) => void
  onPause?: (order: ProductionOrder) => void
  onComplete?: (order: ProductionOrder) => void
  onClick?: (order: ProductionOrder) => void
  className?: string
}
export function ProductionOrderCard({
  order,
  compact = false,
  showActions = false,
  showProgress = true,
  onEdit,
  onDelete,
  onStart,
  onPause,
  onComplete,
  onClick,
  className,
}: ProductionOrderCardProps) {
  const getStatusIcon = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'planned':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'in-progress':
        return <Play className="w-4 h-4 text-green-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <Square className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }
  const getStatusBadge = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'planned':
        return (
          <Badge variant="secondary" className="text-xs">
            Planned
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge variant="default" className="text-xs">
            In Progress
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
            Paused
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="text-xs">
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive" className="text-xs">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        )
    }
  }
  const getPriorityBadge = (priority: ProductionOrder['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="outline" className="text-xs border-red-200 text-red-600">
            High
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
            Medium
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="outline" className="text-xs border-green-200 text-green-600">
            Low
          </Badge>
        )
      default:
        return null
    }
  }
  const getDaysUntilDue = () => {
    const now = new Date()
    const diffTime = order.dueDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const daysUntilDue = getDaysUntilDue()
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue <= 2 && daysUntilDue >= 0
  const completedSteps = order.steps.filter((step) => step.status === 'completed').length
  const totalSteps = order.steps.length
  if (compact) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
      <div
        className={cn(
          'p-3 border rounded-lg transition-colors',
          onClick && 'cursor-pointer hover:bg-muted/50',
          isOverdue && 'border-red-200 bg-red-50',
          isDueSoon && 'border-yellow-200 bg-yellow-50',
          className
        )}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={() => onClick?.(order)}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick(order)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">{order.orderNumber}</div>
              <div className="text-xs text-muted-foreground">{order.productName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            {getStatusBadge(order.status)}
          </div>
        </div>
        {showProgress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span>{order.progress}%</span>
            </div>
            <Progress value={order.progress} className="h-1" />
          </div>
        )}
      </div>
    )
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Package className="w-6 h-6 text-muted-foreground mt-1" />
            <div>
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">{order.productName}</p>
              {order.description && (
                <p className="text-xs text-muted-foreground mt-1">{order.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(order.priority)}
            {getStatusBadge(order.status)}
          </div>
        </div>
        {/* Key Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{order.quantity}</div>
            <div className="text-xs text-muted-foreground">{order.unit}</div>
          </div>
          <div
            className={cn(
              'text-center p-3 rounded-lg',
              isOverdue && 'bg-red-50',
              isDueSoon && 'bg-yellow-50',
              !isOverdue && !isDueSoon && 'bg-green-50'
            )}
          >
            <div
              className={cn(
                'text-lg font-bold',
                isOverdue && 'text-red-600',
                isDueSoon && 'text-yellow-600',
                !isOverdue && !isDueSoon && 'text-green-600'
              )}
            >
              {Math.abs(daysUntilDue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isOverdue ? 'Days Overdue' : 'Days Left'}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {completedSteps}/{totalSteps}
            </div>
            <div className="text-xs text-muted-foreground">Steps Done</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{order.progress}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{order.progress}%</span>
            </div>
            <Progress value={order.progress} className="h-3" />
            {order.estimatedCompletionTime && (
              <div className="text-xs text-muted-foreground text-right">
                Est. completion: {order.estimatedCompletionTime.toLocaleDateString()}
              </div>
            )}
          </div>
        )}
        {/* Timeline */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Due:</span>
              <div
                className={cn(
                  'font-medium',
                  isOverdue && 'text-red-600',
                  isDueSoon && 'text-yellow-600'
                )}
              >
                {order.dueDate.toLocaleDateString()}
              </div>
            </div>
            {order.startDate && (
              <div>
                <span className="text-muted-foreground">Started:</span>
                <div className="font-medium">{order.startDate.toLocaleDateString()}</div>
              </div>
            )}
            {order.completedDate && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <div className="font-medium">{order.completedDate.toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
        {/* Materials */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Materials ({order.materials.length})
          </h4>
          <div className="space-y-1">
            {order.materials.slice(0, 3).map((material) => (
              <div
                key={material.id}
                className="flex justify-between items-center text-xs p-2 bg-muted rounded"
              >
                <span>
                  {material.name} ({material.grade})
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {material.quantity} {material.unit}
                  </span>
                  {material.allocated ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
            {order.materials.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{order.materials.length - 3} more materials
              </div>
            )}
          </div>
        </div>
        {/* Customer */}
        {order.customer && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer}</span>
          </div>
        )}
        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-medium text-sm mb-1">Notes</h5>
            <p className="text-xs text-muted-foreground">{order.notes}</p>
          </div>
        )}
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            {order.status === 'planned' && onStart && (
              <Button type="button" onClick={() => onStart(order)} size="sm" variant="default">
                <Play className="w-3 h-3 mr-1" />
                Start
              </Button>
            )}
            {order.status === 'in-progress' && onPause && (
              <Button type="button" onClick={() => onPause(order)} size="sm" variant="outline">
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            )}
            {(order.status === 'in-progress' || order.status === 'paused') && onComplete && (
              <Button type="button" onClick={() => onComplete(order)} size="sm" variant="default">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            )}
            {onEdit && (
              <Button type="button" onClick={() => onEdit(order)} size="sm" variant="outline">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button type="button" onClick={() => onDelete(order)} size="sm" variant="destructive">
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
