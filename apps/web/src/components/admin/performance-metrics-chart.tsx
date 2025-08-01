'use client'

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import { Activity, BarChart3, Clock, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PerformanceDataPoint {
  timestamp: string
  responseTime: number
  queryCount: number
  activeConnections: number
  database: string
}

interface PerformanceMetricsProps {
  data?: PerformanceDataPoint[]
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function PerformanceMetricsChart({
  data = [],
  autoRefresh = true,
  refreshInterval = 30000,
}: PerformanceMetricsProps) {
  const [currentData, setCurrentData] = useState<PerformanceDataPoint[]>(data)
  const [selectedMetric, setSelectedMetric] = useState<
    'responseTime' | 'queryCount' | 'activeConnections'
  >('responseTime')
  const [_timeRange, _setTimeRange] = useState<'5m' | '30m' | '1h' | '24h'>('30m')

  useEffect(() => {
    setCurrentData(data)
  }, [data])

  const getMetricValue = (point: PerformanceDataPoint) => {
    switch (selectedMetric) {
      case 'responseTime':
        return point.responseTime
      case 'queryCount':
        return point.queryCount
      case 'activeConnections':
        return point.activeConnections
    }
  }

  const getMetricUnit = () => {
    switch (selectedMetric) {
      case 'responseTime':
        return 'ms'
      case 'queryCount':
        return '/min'
      case 'activeConnections':
        return ''
    }
  }

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'responseTime':
        return 'Temps de réponse'
      case 'queryCount':
        return 'Requêtes'
      case 'activeConnections':
        return 'Connexions actives'
    }
  }

  const _getMetricIcon = () => {
    switch (selectedMetric) {
      case 'responseTime':
        return <Clock className="w-4 h-4" />
      case 'queryCount':
        return <Zap className="w-4 h-4" />
      case 'activeConnections':
        return <Activity className="w-4 h-4" />
    }
  }

  const getCurrentAverage = () => {
    if (currentData.length === 0) return 0
    const sum = currentData.reduce((acc, point) => acc + getMetricValue(point), 0)
    return Math.round(sum / currentData.length)
  }

  const getTrend = () => {
    if (currentData.length < 2) return 'stable'

    const recent = currentData.slice(-5)
    const older = currentData.slice(-15, -10)

    if (recent.length === 0 || older.length === 0) return 'stable'

    const recentAvg = recent.reduce((acc, point) => acc + getMetricValue(point), 0) / recent.length
    const olderAvg = older.reduce((acc, point) => acc + getMetricValue(point), 0) / older.length

    const diff = ((recentAvg - olderAvg) / olderAvg) * 100

    if (Math.abs(diff) < 5) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  const maxValue = currentData.length > 0 ? Math.max(...currentData.map(getMetricValue)) : 0
  const minValue = currentData.length > 0 ? Math.min(...currentData.map(getMetricValue)) : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Métriques de Performance</span>
            </CardTitle>
            <CardDescription>Monitoring en temps réel des performances système</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={autoRefresh ? 'success' : 'secondary'} className="text-xs">
              {autoRefresh ? 'Live' : 'Statique'}
            </Badge>
            <Button size="sm" variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sélection de métrique */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(['responseTime', 'queryCount', 'activeConnections'] as const).map((metric) => (
              <Button
                key={metric}
                size="sm"
                variant={selectedMetric === metric ? 'default' : 'outline'}
                onClick={() => setSelectedMetric(metric)}
                className="text-xs"
              >
                {metric === 'responseTime' && <Clock className="w-3 h-3 mr-1" />}
                {metric === 'queryCount' && <Zap className="w-3 h-3 mr-1" />}
                {metric === 'activeConnections' && <Activity className="w-3 h-3 mr-1" />}
                {getMetricLabel()}
              </Button>
            ))}
          </div>
        </div>

        {/* Statistiques actuelles */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getCurrentAverage()}
              {getMetricUnit()}
            </div>
            <div className="text-xs text-muted-foreground">Moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {minValue}
              {getMetricUnit()}
            </div>
            <div className="text-xs text-muted-foreground">Minimum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {maxValue}
              {getMetricUnit()}
            </div>
            <div className="text-xs text-muted-foreground">Maximum</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp
                className={`w-4 h-4 ${
                  getTrend() === 'up'
                    ? 'text-red-500'
                    : getTrend() === 'down'
                      ? 'text-green-500'
                      : 'text-gray-500'
                }`}
              />
            </div>
            <div className="text-xs text-muted-foreground">Tendance</div>
          </div>
        </div>

        {/* Graphique simple avec barres */}
        {currentData.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{getMetricLabel()}</span>
              <span className="text-muted-foreground">{currentData.length} points de données</span>
            </div>

            <div className="h-32 flex items-end space-x-1 border-b border-l pl-2 pb-2">
              {currentData.slice(-20).map((point, index) => {
                const value = getMetricValue(point)
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${new Date(point.timestamp).toLocaleTimeString()}: ${value}${getMetricUnit()}`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {new Date(
                  currentData[Math.max(0, currentData.length - 20)].timestamp
                ).toLocaleTimeString()}
              </span>
              <span>
                {new Date(currentData[currentData.length - 1].timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center border border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune donnée de performance</p>
              <p className="text-xs">Démarrez l'API backend pour voir les métriques</p>
            </div>
          </div>
        )}

        {/* Alertes et seuils */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Seuil d'alerte:</span>
            <span className="font-mono">
              {selectedMetric === 'responseTime' && '> 50ms'}
              {selectedMetric === 'queryCount' && '> 100/min'}
              {selectedMetric === 'activeConnections' && '> 15'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
