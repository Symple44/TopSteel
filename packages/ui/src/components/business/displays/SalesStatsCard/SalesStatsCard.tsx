'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  Calendar,
  BarChart3,
  Download,
  Eye,
  Filter,
  Package,
  Truck,
  Star,
  AlertTriangle
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface SalesStats {
  id: string
  period: {
    start: Date
    end: Date
    label: string
  }
  region?: {
    id: string
    name: string
  }
  salesRep?: {
    id: string
    name: string
    avatar?: string
  }
  metrics: {
    totalRevenue: {
      value: number
      target?: number
      previousPeriod?: number
    }
    orderCount: {
      value: number
      target?: number
      previousPeriod?: number
    }
    averageOrderValue: {
      value: number
      target?: number
      previousPeriod?: number
    }
    conversionRate: {
      value: number // percentage
      target?: number
      previousPeriod?: number
    }
    customerCount: {
      new: number
      returning: number
      total: number
      previousPeriod?: number
    }
  }
  topProducts: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
    steelGrade?: string
  }>
  customerSegments: {
    vip: { count: number; revenue: number }
    regular: { count: number; revenue: number }
    new: { count: number; revenue: number }
  }
  performance: {
    quota: number
    achieved: number
    quotaPercentage: number
    ranking?: number
    totalReps?: number
  }
  trends: {
    revenueGrowth: number
    orderGrowth: number
    customerGrowth: number
  }
  alerts?: Array<{
    id: string
    type: 'quota' | 'decline' | 'opportunity' | 'target'
    severity: 'low' | 'medium' | 'high'
    message: string
  }>
  currency: string
}
interface SalesStatsCardProps {
  stats: SalesStats
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  onExport?: () => void
  onViewCustomers?: () => void
  className?: string
  loading?: boolean
  compact?: boolean
}
export function SalesStatsCard({
  stats,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  onExport,
  onViewCustomers,
  className,
  loading = false,
  compact = false,
}: SalesStatsCardProps) {
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
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const formatNumber = (value: number, precision: number = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(value)
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
  const getTrendColor = (current: number, previous?: number) => {
    if (!previous) return 'text-gray-500'
    return current > previous ? 'text-green-500' : 'text-red-500'
  }
  const getTrendPercentage = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }
  const getQuotaStatus = () => {
    const percentage = stats.performance.quotaPercentage
    if (percentage >= 100) return { status: 'achieved', color: 'text-green-600', bgColor: 'bg-green-100 border-green-200' }
    if (percentage >= 80) return { status: 'on-track', color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-200' }
    if (percentage >= 60) return { status: 'behind', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-200' }
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100 border-red-200' }
  }
  const quotaStatus = getQuotaStatus()
  const highAlerts = stats.alerts?.filter(a => a.severity === 'high') || []
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Ventes {stats.region?.name || 'Générales'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {stats.period.label} • {formatDate(stats.period.start)} - {formatDate(stats.period.end)}
                {stats.salesRep && (
                  <span className="ml-2">• {stats.salesRep.name}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={cn('text-xs', quotaStatus.bgColor)}>
              Quota: {stats.performance.quotaPercentage.toFixed(0)}%
            </Badge>
            {highAlerts.length > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highAlerts.length} alerte{highAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">
                {formatCurrency(stats.metrics.totalRevenue.value, stats.currency)}
              </p>
              {stats.metrics.totalRevenue.previousPeriod && (
                <div className="flex items-center gap-1">
                  {React.createElement(
                    getTrendIcon(stats.metrics.totalRevenue.value, stats.metrics.totalRevenue.previousPeriod),
                    { 
                      className: cn(
                        'h-3 w-3',
                        getTrendColor(stats.metrics.totalRevenue.value, stats.metrics.totalRevenue.previousPeriod)
                      )
                    }
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    getTrendColor(stats.metrics.totalRevenue.value, stats.metrics.totalRevenue.previousPeriod)
                  )}>
                    {Math.abs(getTrendPercentage(stats.metrics.totalRevenue.value, stats.metrics.totalRevenue.previousPeriod)).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {stats.metrics.totalRevenue.target && (
              <div className="text-xs text-muted-foreground">
                Objectif: {formatCurrency(stats.metrics.totalRevenue.target, stats.currency)}
                <span className={cn(
                  'ml-1 font-medium',
                  stats.metrics.totalRevenue.value >= stats.metrics.totalRevenue.target ? 'text-green-600' : 'text-red-600'
                )}>
                  ({((stats.metrics.totalRevenue.value / stats.metrics.totalRevenue.target) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Commandes</p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">
                {formatNumber(stats.metrics.orderCount.value)}
              </p>
              {stats.metrics.orderCount.previousPeriod && (
                <div className="flex items-center gap-1">
                  {React.createElement(
                    getTrendIcon(stats.metrics.orderCount.value, stats.metrics.orderCount.previousPeriod),
                    { 
                      className: cn(
                        'h-3 w-3',
                        getTrendColor(stats.metrics.orderCount.value, stats.metrics.orderCount.previousPeriod)
                      )
                    }
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    getTrendColor(stats.metrics.orderCount.value, stats.metrics.orderCount.previousPeriod)
                  )}>
                    {Math.abs(getTrendPercentage(stats.metrics.orderCount.value, stats.metrics.orderCount.previousPeriod)).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {stats.metrics.orderCount.target && (
              <div className="text-xs text-muted-foreground">
                Objectif: {formatNumber(stats.metrics.orderCount.target)}
              </div>
            )}
          </div>
        </div>
        {!compact && (
          <>
            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Panier moyen</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(stats.metrics.averageOrderValue.value, stats.currency)}
                </p>
                {stats.metrics.averageOrderValue.previousPeriod && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {React.createElement(
                      getTrendIcon(stats.metrics.averageOrderValue.value, stats.metrics.averageOrderValue.previousPeriod),
                      { 
                        className: cn(
                          'h-3 w-3',
                          getTrendColor(stats.metrics.averageOrderValue.value, stats.metrics.averageOrderValue.previousPeriod)
                        )
                      }
                    )}
                    <span className={cn(
                      'text-xs',
                      getTrendColor(stats.metrics.averageOrderValue.value, stats.metrics.averageOrderValue.previousPeriod)
                    )}>
                      {Math.abs(getTrendPercentage(stats.metrics.averageOrderValue.value, stats.metrics.averageOrderValue.previousPeriod)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="font-semibold text-sm">{stats.metrics.conversionRate.value.toFixed(1)}%</p>
                {stats.metrics.conversionRate.target && (
                  <p className="text-xs text-muted-foreground">
                    Obj: {stats.metrics.conversionRate.target.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="font-semibold text-sm">{stats.metrics.customerCount.total}</p>
                <p className="text-xs text-green-600">{stats.metrics.customerCount.new} nouveaux</p>
              </div>
            </div>
            {/* Quota Progress */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Progression quota</p>
                <div className="flex items-center gap-2">
                  {stats.performance.ranking && stats.performance.totalReps && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {stats.performance.ranking}/{stats.performance.totalReps}
                    </Badge>
                  )}
                  <span className={cn('text-sm font-medium', quotaStatus.color)}>
                    {stats.performance.quotaPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    quotaStatus.status === 'achieved' ? 'bg-green-500' :
                    quotaStatus.status === 'on-track' ? 'bg-blue-500' :
                    quotaStatus.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(stats.performance.quotaPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(stats.performance.achieved, stats.currency)}</span>
                <span>{formatCurrency(stats.performance.quota, stats.currency)}</span>
              </div>
            </div>
            {/* Top Products */}
            {stats.topProducts.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">Produits les plus vendus</p>
                <div className="space-y-1">
                  {stats.topProducts.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <span className="truncate block">{product.name}</span>
                          {product.steelGrade && (
                            <span className="text-xs text-muted-foreground">
                              Grade: {product.steelGrade}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue, stats.currency)}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} unités</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Customer Segments */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">VIP</p>
                <p className="font-semibold text-sm">{stats.customerSegments.vip.count}</p>
                <p className="text-xs text-purple-600">
                  {formatCurrency(stats.customerSegments.vip.revenue, stats.currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Réguliers</p>
                <p className="font-semibold text-sm">{stats.customerSegments.regular.count}</p>
                <p className="text-xs text-blue-600">
                  {formatCurrency(stats.customerSegments.regular.revenue, stats.currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Nouveaux</p>
                <p className="font-semibold text-sm">{stats.customerSegments.new.count}</p>
                <p className="text-xs text-green-600">
                  {formatCurrency(stats.customerSegments.new.revenue, stats.currency)}
                </p>
              </div>
            </div>
            {/* High Priority Alerts */}
            {highAlerts.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Alertes importantes
                </p>
                <div className="space-y-1">
                  {highAlerts.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                      <p className="font-medium text-red-800">{alert.message}</p>
                    </div>
                  ))}
                  {highAlerts.length > 2 && (
                    <p className="text-xs text-red-600">
                      +{highAlerts.length - 2} autre{highAlerts.length - 2 > 1 ? 's' : ''} alerte{highAlerts.length - 2 > 1 ? 's' : ''}
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
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Détails
              </Button>
            )}
            {onViewCustomers && (
              <Button variant="outline" size="sm" onClick={onViewCustomers} className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Clients
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                Exporter
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
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
