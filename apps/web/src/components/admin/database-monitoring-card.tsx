'use client'

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from '@erp/ui'
import {
  Activity,
  AlertTriangle,
  Database,
  Timer,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface DatabaseMetrics {
  database: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  isConnected: boolean
  responseTime?: number
  error?: string
  uptime?: number
  activeConnections?: number
  queryCount?: number
  lastBackup?: string
}

interface MonitoringCardProps {
  metrics: DatabaseMetrics
  variant?: 'auth' | 'shared' | 'tenant'
}

export function DatabaseMonitoringCard({ metrics, variant = 'tenant' }: MonitoringCardProps) {
  const [previousResponseTime, setPreviousResponseTime] = useState<number | null>(null)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

  useEffect(() => {
    if (metrics.responseTime && previousResponseTime !== null) {
      const diff = metrics.responseTime - previousResponseTime
      if (Math.abs(diff) < 2) {
        setTrend('stable')
      } else if (diff > 0) {
        setTrend('up')
      } else {
        setTrend('down')
      }
    }
    if (metrics.responseTime) {
      setPreviousResponseTime(metrics.responseTime)
    }
  }, [metrics.responseTime, previousResponseTime])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'unhealthy':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getVariantIcon = () => {
    switch (variant) {
      case 'auth':
        return <Database className="w-5 h-5 text-blue-600" />
      case 'shared':
        return <Database className="w-5 h-5 text-purple-600" />
      case 'tenant':
        return <Database className="w-5 h-5 text-orange-600" />
    }
  }

  const getVariantColor = () => {
    switch (variant) {
      case 'auth':
        return 'border-l-blue-500'
      case 'shared':
        return 'border-l-purple-500'
      case 'tenant':
        return 'border-l-orange-500'
    }
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-green-500" />
      default:
        return null
    }
  }

  return (
    <Card className={`border-l-4 ${getVariantColor()} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getVariantIcon()}
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                {metrics.database}
              </CardTitle>
              <CardDescription className="text-xs">Base de données {variant}</CardDescription>
            </div>
          </div>
          <Badge
            variant={
              getStatusBadgeVariant(metrics.status) as
                | 'default'
                | 'secondary'
                | 'destructive'
                | 'outline'
            }
            className="text-xs"
          >
            {metrics.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de connexion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {metrics.isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">Connexion</span>
          </div>
          <span className={`text-sm ${metrics.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.isConnected ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Temps de réponse */}
        {metrics.responseTime !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Latence</span>
                {getTrendIcon()}
              </div>
              <span className="text-sm font-mono">{metrics.responseTime}ms</span>
            </div>
            <Progress value={Math.min((metrics.responseTime / 100) * 100, 100)} className="h-1" />
          </div>
        )}

        {/* Connexions actives */}
        {metrics.activeConnections !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Connexions actives</span>
            </div>
            <span className="text-sm font-mono">{metrics.activeConnections}</span>
          </div>
        )}

        {/* Uptime */}
        {metrics.uptime !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Uptime</span>
            <span className="text-sm font-mono">{formatUptime(metrics.uptime)}</span>
          </div>
        )}

        {/* Requêtes */}
        {metrics.queryCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Requêtes/min</span>
            <span className="text-sm font-mono">{metrics.queryCount}</span>
          </div>
        )}

        {/* Dernière sauvegarde */}
        {metrics.lastBackup && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Dernière backup</span>
            <span className="text-xs text-muted-foreground">
              {new Date(metrics.lastBackup).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Erreur */}
        {metrics.error && (
          <div className="flex items-start space-x-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Erreur détectée</p>
              <p className="text-xs text-red-600 dark:text-red-300 break-words">{metrics.error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
