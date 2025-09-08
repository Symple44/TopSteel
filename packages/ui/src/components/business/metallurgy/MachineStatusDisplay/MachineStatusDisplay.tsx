'use client'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Gauge,
  Pause,
  Play,
  Square,
  Thermometer,
  Wrench,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'

interface MachineParameter {
  name: string
  value: number
  unit: string
  min: number
  max: number
  optimal?: { min: number; max: number }
  status: 'normal' | 'warning' | 'critical'
}
interface MachineStatus {
  id: string
  name: string
  type: 'cutting' | 'welding' | 'forming' | 'milling' | 'grinding' | 'coating'
  status: 'running' | 'idle' | 'maintenance' | 'error' | 'offline'
  operator?: string
  currentJob?: {
    id: string
    name: string
    progress: number
    estimatedCompletion: Date
  }
  parameters: MachineParameter[]
  lastMaintenance: Date
  nextMaintenance: Date
  operatingHours: number
  efficiency: number
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: Date
  }>
}
interface MachineStatusDisplayProps {
  className?: string
  machine: MachineStatus
  compact?: boolean
  showParameters?: boolean
  showAlerts?: boolean
  onStatusClick?: (machine: MachineStatus) => void
  onParameterClick?: (parameter: MachineParameter) => void
}
export function MachineStatusDisplay({
  className,
  machine,
  compact = false,
  showParameters = true,
  showAlerts = true,
  onStatusClick,
  onParameterClick,
}: MachineStatusDisplayProps) {
  const getStatusIcon = (status: MachineStatus['status']) => {
    switch (status) {
      case 'running':
        return <Play className="w-5 h-5 text-green-600" />
      case 'idle':
        return <Pause className="w-5 h-5 text-yellow-600" />
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-blue-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'offline':
        return <Square className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }
  const getStatusBadge = (status: MachineStatus['status']) => {
    switch (status) {
      case 'running':
        return (
          <Badge variant="default" className="text-xs">
            Running
          </Badge>
        )
      case 'idle':
        return (
          <Badge variant="secondary" className="text-xs">
            Idle
          </Badge>
        )
      case 'maintenance':
        return (
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
            Maintenance
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            Error
          </Badge>
        )
      case 'offline':
        return (
          <Badge variant="outline" className="text-xs text-gray-600">
            Offline
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
  const getParameterStatus = (param: MachineParameter) => {
    const { value, optimal, status } = param
    if (status === 'critical') return 'text-red-600 bg-red-50'
    if (status === 'warning') return 'text-orange-600 bg-orange-50'
    if (optimal && value >= optimal.min && value <= optimal.max) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }
  const getMachineTypeIcon = (type: MachineStatus['type']) => {
    switch (type) {
      case 'cutting':
        return '✂️'
      case 'welding':
        return '🔥'
      case 'forming':
        return '🔨'
      case 'milling':
        return '⚙️'
      case 'grinding':
        return '💿'
      case 'coating':
        return '🎨'
      default:
        return '🏭'
    }
  }
  const getMaintenanceStatus = () => {
    const now = new Date()
    const daysUntilMaintenance = Math.ceil(
      (machine.nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilMaintenance < 0)
      return { status: 'overdue', days: Math.abs(daysUntilMaintenance), color: 'text-red-600' }
    if (daysUntilMaintenance <= 7)
      return { status: 'due_soon', days: daysUntilMaintenance, color: 'text-orange-600' }
    return { status: 'scheduled', days: daysUntilMaintenance, color: 'text-green-600' }
  }
  const maintenanceStatus = getMaintenanceStatus()
  if (compact) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
      <div
        className={cn(
          'p-3 border rounded-lg transition-colors',
          onStatusClick && 'cursor-pointer hover:bg-muted/50',
          machine.status === 'error' && 'border-red-200 bg-red-50',
          machine.status === 'running' && 'border-green-200 bg-green-50',
          className
        )}
        role={onStatusClick ? 'button' : undefined}
        tabIndex={onStatusClick ? 0 : undefined}
        onClick={() => onStatusClick?.(machine)}
        onKeyDown={(e) => {
          if (onStatusClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onStatusClick(machine)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg">{getMachineTypeIcon(machine.type)}</div>
            <div>
              <div className="font-medium text-sm">{machine.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{machine.type}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(machine.status)}
            {getStatusBadge(machine.status)}
          </div>
        </div>
        {machine.currentJob && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{machine.currentJob.name}</span>
              <span>{machine.currentJob.progress}%</span>
            </div>
            <Progress value={machine.currentJob.progress} className="h-1" />
          </div>
        )}
      </div>
    )
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getMachineTypeIcon(machine.type)}</div>
            <div>
              <h3 className="text-lg font-semibold">{machine.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {machine.type} Machine • ID: {machine.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(machine.status)}
            {getStatusBadge(machine.status)}
          </div>
        </div>
        {/* Current Job */}
        {machine.currentJob && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">Current Job</h4>
                <p className="text-sm text-muted-foreground">{machine.currentJob.name}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{machine.currentJob.progress}%</div>
                <div className="text-xs text-muted-foreground">
                  ETA: {machine.currentJob.estimatedCompletion.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <Progress value={machine.currentJob.progress} className="h-3" />
          </div>
        )}
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Gauge className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-blue-600">{machine.efficiency}%</div>
            <div className="text-xs text-muted-foreground">Efficiency</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold text-purple-600">
              {machine.operatingHours.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Operating Hours</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-bold text-green-600">
              {Math.ceil((Date.now() - machine.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-xs text-muted-foreground">Days Since Maintenance</div>
          </div>
          <div
            className={cn(
              'text-center p-3 rounded-lg',
              maintenanceStatus.status === 'overdue' && 'bg-red-50',
              maintenanceStatus.status === 'due_soon' && 'bg-orange-50',
              maintenanceStatus.status === 'scheduled' && 'bg-green-50'
            )}
          >
            <Calendar className={cn('w-6 h-6 mx-auto mb-1', maintenanceStatus.color)} />
            <div className={cn('text-lg font-bold', maintenanceStatus.color)}>
              {maintenanceStatus.days}
            </div>
            <div className="text-xs text-muted-foreground">
              {maintenanceStatus.status === 'overdue' ? 'Days Overdue' : 'Days Until Maintenance'}
            </div>
          </div>
        </div>
        {/* Operating Parameters */}
        {showParameters && machine.parameters.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Operating Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {machine.parameters.map((param, index) => {
                const progressValue = ((param.value - param.min) / (param.max - param.min)) * 100
                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      getParameterStatus(param),
                      onParameterClick && 'cursor-pointer hover:bg-opacity-70'
                    )}
                    role={onParameterClick ? 'button' : undefined}
                    tabIndex={onParameterClick ? 0 : undefined}
                    onClick={() => onParameterClick?.(param)}
                    onKeyDown={(e) => {
                      if (onParameterClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onParameterClick(param)
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{param.name}</span>
                      <span className="text-sm">
                        {param.value.toFixed(1)} {param.unit}
                      </span>
                    </div>
                    <Progress
                      value={progressValue}
                      className={cn(
                        'h-2 mb-1',
                        param.status === 'critical' && '[&>div]:bg-red-500',
                        param.status === 'warning' && '[&>div]:bg-orange-500',
                        param.status === 'normal' && '[&>div]:bg-green-500'
                      )}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {param.min}</span>
                      {param.optimal && (
                        <span>
                          Optimal: {param.optimal.min}-{param.optimal.max}
                        </span>
                      )}
                      <span>Max: {param.max}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Alerts */}
        {showAlerts && machine.alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Active Alerts ({machine.alerts.length})
            </h4>
            <div className="space-y-2">
              {machine.alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border-l-4',
                    alert.type === 'error' && 'border-l-red-500 bg-red-50',
                    alert.type === 'warning' && 'border-l-orange-500 bg-orange-50',
                    alert.type === 'info' && 'border-l-blue-500 bg-blue-50'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm">{alert.message}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {machine.alerts.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{machine.alerts.length - 3} more alerts
                </div>
              )}
            </div>
          </div>
        )}
        {/* Operator Info */}
        {machine.operator && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Operator:</span>
              <span className="font-medium">{machine.operator}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
