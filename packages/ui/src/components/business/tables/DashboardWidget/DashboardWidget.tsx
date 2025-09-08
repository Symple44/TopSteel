'use client'
import {
  ArrowDown,
  ArrowUp,
  Download,
  Maximize2,
  MoreVertical,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { WidgetStatus } from '../../../../types/variants'
import { mapWidgetStatusToBadge } from '../../../../types/variants'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
import { Badge, Progress } from '../../../primitives'
import { Button } from '../../../primitives/button/Button'
export interface WidgetData {
  type: 'metric' | 'chart' | 'list' | 'progress' | 'status' | 'custom'
  title: string
  subtitle?: string
  value?: string | number
  previousValue?: string | number
  change?: number // percentage
  changeLabel?: string
  trend?: 'up' | 'down' | 'stable'
  progress?: number // 0-100
  target?: number
  unit?: string
  icon?: React.ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  items?: Array<{
    label: string
    value: string | number
    change?: number
    icon?: React.ReactNode
  }>
  chartData?: Array<{
    label: string
    value: number
  }>
  status?: {
    label: string
    variant: WidgetStatus
  }
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }>
  lastUpdated?: Date
  refreshInterval?: number // in seconds
}
interface DashboardWidgetProps {
  data?: WidgetData
  size?: 'small' | 'medium' | 'large' | 'full'
  loading?: boolean
  error?: string
  showActions?: boolean
  showRefresh?: boolean
  onRefresh?: () => void
  onExpand?: () => void
  onExport?: () => void
  onSettings?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}
export function DashboardWidget({
  data,
  size = 'medium',
  loading = false,
  error,
  showActions = true,
  showRefresh = true,
  onRefresh,
  onExpand,
  onExport,
  onSettings,
  onEdit,
  onDelete,
  className,
}: DashboardWidgetProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            {onRefresh && (
              <Button
                type="button"
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    )
  }
  const getTrendIcon = () => {
    if (data.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (data.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }
  const getChangeColor = () => {
    if (!data.change) return ''
    return data.change >= 0 ? 'text-green-600' : 'text-red-600'
  }
  const formatValue = (value: string | number | undefined) => {
    if (value === undefined) return '-'
    if (typeof value === 'number') {
      if (data.unit === '€' || data.unit === '$') {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: data.unit === '€' ? 'EUR' : 'USD',
        }).format(value)
      }
      return new Intl.NumberFormat('fr-FR').format(value)
    }
    return value
  }
  const formatDate = (date?: Date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'À l’instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  // Render simple bar chart
  const renderMiniChart = () => {
    if (!data.chartData || data.chartData.length === 0) return null
    const maxValue = Math.max(...data.chartData.map((d) => d.value))
    return (
      <div className="flex items-end justify-between gap-1 h-16 mt-4">
        {data.chartData.slice(-10).map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div
              key={index}
              className="flex-1 bg-blue-500 opacity-70 hover:opacity-100 rounded-t transition-all relative group"
              style={{ height: `${height}%` }}
            >
              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}: {item.value}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  const colorClasses = {
    default: '',
    primary: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50',
  }
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-3',
    full: 'col-span-full',
  }
  return (
    <Card className={`${className} ${colorClasses[data.color || 'default']} ${sizeClasses[size]}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{data.title}</CardTitle>
          {data.subtitle && <p className="text-xs text-muted-foreground mt-1">{data.subtitle}</p>}
        </div>
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showRefresh && onRefresh && (
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </DropdownMenuItem>
              )}
              {onExpand && (
                <DropdownMenuItem onClick={onExpand}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Agrandir
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </DropdownMenuItem>
              )}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
              )}
              {(onEdit || onDelete) && <DropdownMenuSeparator />}
              {onEdit && <DropdownMenuItem onClick={onEdit}>Modifier</DropdownMenuItem>}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {/* Metric Widget */}
        {data.type === 'metric' && (
          <div>
            <div className="flex items-baseline gap-2">
              {data.icon}
              <span className="text-2xl font-bold">
                {formatValue(data.value)}
                {data.unit && typeof data.value === 'number' && (
                  <span className="text-lg font-normal text-muted-foreground ml-1">
                    {data.unit}
                  </span>
                )}
              </span>
              {data.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
                  {data.change >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span className="font-medium">{Math.abs(data.change)}%</span>
                </div>
              )}
              {getTrendIcon()}
            </div>
            {data.previousValue !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                vs {formatValue(data.previousValue)} {data.changeLabel || 'précédent'}
              </p>
            )}
            {data.chartData && renderMiniChart()}
          </div>
        )}
        {/* Progress Widget */}
        {data.type === 'progress' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{formatValue(data.value)}</span>
              {data.target && (
                <span className="text-muted-foreground">/ {formatValue(data.target)}</span>
              )}
            </div>
            <Progress value={data.progress || 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{data.progress || 0}%</span>
              {data.change !== undefined && (
                <span className={getChangeColor()}>
                  {data.change >= 0 ? '+' : ''}
                  {data.change}% {data.changeLabel}
                </span>
              )}
            </div>
          </div>
        )}
        {/* Status Widget */}
        {data.type === 'status' && data.status && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{formatValue(data.value)}</p>
              {data.subtitle && <p className="text-sm text-muted-foreground">{data.subtitle}</p>}
            </div>
            <Badge variant={mapWidgetStatusToBadge(data.status.variant)}>{data.status.label}</Badge>
          </div>
        )}
        {/* List Widget */}
        {data.type === 'list' && data.items && (
          <div className="space-y-2">
            {data.items.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatValue(item.value)}</span>
                  {item.change !== undefined && (
                    <span
                      className={`text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {item.change >= 0 ? '+' : ''}
                      {item.change}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Chart Widget */}
        {data.type === 'chart' && data.chartData && (
          <div>
            {renderMiniChart()}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{data.chartData[0]?.label}</span>
              <span>{data.chartData[data.chartData.length - 1]?.label}</span>
            </div>
          </div>
        )}
        {/* Custom Widget */}
        {data.type === 'custom' && (
          <div>
            <p className="text-2xl font-bold">{formatValue(data.value)}</p>
            {data.actions && data.actions.length > 0 && (
              <div className="flex gap-2 mt-4">
                {data.actions.map((action, index) => (
                  <Button
                    type="button"
                    key={index}
                    onClick={action.onClick}
                    variant="outline"
                    size="sm"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Last Updated */}
        {data.lastUpdated && (
          <div className="mt-4 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {formatDate(data.lastUpdated)}
              {data.refreshInterval && (
                <span> • Actualisation toutes les {data.refreshInterval}s</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
