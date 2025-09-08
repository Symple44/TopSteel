'use client'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Minus,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import React from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
export interface ProductionStats {
  id: string
  period: {
    start: Date
    end: Date
    label: string
  }
  facility: {
    id: string
    name: string
    type: 'foundry' | 'rolling_mill' | 'finishing' | 'warehouse'
  }
  metrics: {
    totalProduction: {
      value: number
      unit: 'tonnes' | 'pieces' | 'meters'
      target?: number
      previousPeriod?: number
    }
    efficiency: {
      value: number // percentage
      target?: number
      previousPeriod?: number
    }
    qualityRate: {
      value: number // percentage
      target?: number
      defectCount?: number
    }
    downtime: {
      value: number // hours
      planned: number
      unplanned: number
      target?: number
    }
    energyConsumption: {
      value: number // kWh or units
      unit: string
      target?: number
      cost?: number
    }
    workforce: {
      active: number
      total: number
      shifts: number
    }
  }
  orders: {
    completed: number
    inProgress: number
    delayed: number
    total: number
  }
  materials: {
    consumed: number
    unit: string
    waste: number
    wastePercentage: number
  }
  equipment: {
    operational: number
    maintenance: number
    outOfService: number
    utilizationRate: number
  }
  alerts?: Array<{
    id: string
    type: 'quality' | 'efficiency' | 'safety' | 'maintenance'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: Date
  }>
}
interface ProductionStatsCardProps {
  stats: ProductionStats
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  onExport?: () => void
  className?: string
  loading?: boolean
  compact?: boolean
}
export function ProductionStatsCard({
  stats,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  onExport,
  className,
  loading = false,
  compact = false,
}: ProductionStatsCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }
  const formatNumber = (value: number, precision: number = 1) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(value)
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return Minus
    if (current > previous) return TrendingUp
    if (current < previous) return TrendingDown
    return Minus
  }
  const getTrendColor = (current: number, previous?: number, isReverse = false) => {
    if (!previous) return 'text-gray-500'
    const isPositive = current > previous
    if (isReverse) {
      return isPositive ? 'text-red-500' : 'text-green-500'
    }
    return isPositive ? 'text-green-500' : 'text-red-500'
  }
  const getTrendPercentage = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }
  const getFacilityIcon = () => {
    switch (stats.facility.type) {
      case 'foundry':
        return Zap
      case 'rolling_mill':
        return Settings
      case 'finishing':
        return Wrench
      case 'warehouse':
        return Activity
      default:
        return Activity
    }
  }
  const getAlertsSeverityCount = () => {
    if (!stats.alerts) return { critical: 0, high: 0, medium: 0, low: 0 }
    return stats.alerts.reduce(
      (acc, alert) => {
        acc[alert.severity]++
        return acc
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    )
  }
  const FacilityIcon = getFacilityIcon()
  const alertsCount = getAlertsSeverityCount()
  const totalAlerts = stats.alerts?.length || 0
  const criticalAlerts = stats.alerts?.filter((a) => a.severity === 'critical') || []
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FacilityIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{stats.facility.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {stats.period.label} • {formatDate(stats.period.start)} -{' '}
                {formatDate(stats.period.end)}
              </p>
            </div>
          </div>
          {totalAlerts > 0 && (
            <Badge
              className={cn(
                'text-xs',
                criticalAlerts.length > 0
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : alertsCount.high > 0
                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              )}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Production totale</p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">
                {formatNumber(stats.metrics.totalProduction.value)}{' '}
                {stats.metrics.totalProduction.unit}
              </p>
              {stats.metrics.totalProduction.previousPeriod && (
                <div className="flex items-center gap-1">
                  {React.createElement(
                    getTrendIcon(
                      stats.metrics.totalProduction.value,
                      stats.metrics.totalProduction.previousPeriod
                    ),
                    {
                      className: cn(
                        'h-3 w-3',
                        getTrendColor(
                          stats.metrics.totalProduction.value,
                          stats.metrics.totalProduction.previousPeriod
                        )
                      ),
                    }
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getTrendColor(
                        stats.metrics.totalProduction.value,
                        stats.metrics.totalProduction.previousPeriod
                      )
                    )}
                  >
                    {Math.abs(
                      getTrendPercentage(
                        stats.metrics.totalProduction.value,
                        stats.metrics.totalProduction.previousPeriod
                      )
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>
            {stats.metrics.totalProduction.target && (
              <div className="flex items-center gap-1 text-xs">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Objectif: {formatNumber(stats.metrics.totalProduction.target)}{' '}
                  {stats.metrics.totalProduction.unit}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    stats.metrics.totalProduction.value >= stats.metrics.totalProduction.target
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  (
                  {(
                    (stats.metrics.totalProduction.value / stats.metrics.totalProduction.target) *
                    100
                  ).toFixed(0)}
                  %)
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Efficacité</p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{formatNumber(stats.metrics.efficiency.value)}%</p>
              {stats.metrics.efficiency.previousPeriod && (
                <div className="flex items-center gap-1">
                  {React.createElement(
                    getTrendIcon(
                      stats.metrics.efficiency.value,
                      stats.metrics.efficiency.previousPeriod
                    ),
                    {
                      className: cn(
                        'h-3 w-3',
                        getTrendColor(
                          stats.metrics.efficiency.value,
                          stats.metrics.efficiency.previousPeriod
                        )
                      ),
                    }
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getTrendColor(
                        stats.metrics.efficiency.value,
                        stats.metrics.efficiency.previousPeriod
                      )
                    )}
                  >
                    {Math.abs(
                      getTrendPercentage(
                        stats.metrics.efficiency.value,
                        stats.metrics.efficiency.previousPeriod
                      )
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>
            {stats.metrics.efficiency.target && (
              <div className="text-xs text-muted-foreground">
                Objectif: {formatNumber(stats.metrics.efficiency.target)}%
              </div>
            )}
          </div>
        </div>
        {!compact && (
          <>
            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Qualité</p>
                <p className="font-semibold text-sm">
                  {formatNumber(stats.metrics.qualityRate.value)}%
                </p>
                {stats.metrics.qualityRate.defectCount && (
                  <p className="text-xs text-red-600">
                    {stats.metrics.qualityRate.defectCount} défauts
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Arrêts</p>
                <p className="font-semibold text-sm">
                  {formatNumber(stats.metrics.downtime.value)}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.metrics.downtime.unplanned)}h imprévu
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Énergie</p>
                <p className="font-semibold text-sm">
                  {formatNumber(stats.metrics.energyConsumption.value)}{' '}
                  {stats.metrics.energyConsumption.unit}
                </p>
                {stats.metrics.energyConsumption.cost && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.metrics.energyConsumption.cost)}
                  </p>
                )}
              </div>
            </div>
            {/* Orders Status */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Commandes</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Terminées</p>
                  <p className="font-semibold text-sm text-green-600">{stats.orders.completed}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">En cours</p>
                  <p className="font-semibold text-sm text-blue-600">{stats.orders.inProgress}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Retard</p>
                  <p className="font-semibold text-sm text-red-600">{stats.orders.delayed}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold text-sm">{stats.orders.total}</p>
                </div>
              </div>
            </div>
            {/* Resources */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {stats.metrics.workforce.active}/{stats.metrics.workforce.total}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {stats.equipment.operational}/
                    {stats.equipment.operational +
                      stats.equipment.maintenance +
                      stats.equipment.outOfService}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatNumber(stats.equipment.utilizationRate)}%</span>
                </div>
              </div>
            </div>
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Alertes critiques
                </p>
                <div className="space-y-1">
                  {criticalAlerts.slice(0, 2).map((alert) => (
                    <div
                      key={alert.id}
                      className="text-xs bg-red-50 p-2 rounded border border-red-200"
                    >
                      <p className="font-medium text-red-800">{alert.message}</p>
                      <p className="text-red-600 mt-1">
                        {new Intl.DateTimeFormat('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        }).format(alert.timestamp)}
                      </p>
                    </div>
                  ))}
                  {criticalAlerts.length > 2 && (
                    <p className="text-xs text-red-600">
                      +{criticalAlerts.length - 2} autre{criticalAlerts.length - 2 > 1 ? 's' : ''}{' '}
                      alerte{criticalAlerts.length - 2 > 1 ? 's' : ''} critique
                      {criticalAlerts.length - 2 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {onViewDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex items-center gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                Détails
              </Button>
            )}
            {onExport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                Exporter
              </Button>
            )}
            {onEdit && (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
