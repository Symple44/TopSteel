'use client'

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Database,
  Info,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  source: 'auth' | 'shared' | 'tenant' | 'system'
  isRead: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  autoResolve?: boolean
}

interface SystemAlertsPanelProps {
  alerts?: SystemAlert[]
  maxAlerts?: number
  autoRefresh?: boolean
}

export function SystemAlertsPanel({
  alerts = [],
  maxAlerts: _maxAlerts = 10,
  autoRefresh: _autoRefresh = true,
}: SystemAlertsPanelProps) {
  const [currentAlerts, setCurrentAlerts] = useState<SystemAlert[]>([])
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  // Initialisation des alertes
  useEffect(() => {
    setCurrentAlerts(alerts)
  }, [alerts])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'warning'
      case 'success':
        return 'success'
      case 'info':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-600'
      case 'high':
        return 'border-l-red-400'
      case 'medium':
        return 'border-l-yellow-400'
      case 'low':
        return 'border-l-blue-400'
      default:
        return 'border-l-gray-400'
    }
  }

  const getSourceIcon = (_source: string) => {
    return <Database className="w-3 h-3" />
  }

  const markAsRead = (alertId: string) => {
    setCurrentAlerts((prev) =>
      prev?.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert))
    )
  }

  const dismissAlert = (alertId: string) => {
    setCurrentAlerts((prev) => prev?.filter((alert) => alert.id !== alertId))
  }

  const markAllAsRead = () => {
    setCurrentAlerts((prev) => prev?.map((alert) => ({ ...alert, isRead: true })))
  }

  const clearAllAlerts = () => {
    setCurrentAlerts([])
  }

  const filteredAlerts = currentAlerts?.filter(
    (alert) => selectedFilter === 'all' || alert.type === selectedFilter
  )

  const unreadCount = currentAlerts?.filter((alert) => !alert.isRead).length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alertes Système</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Monitoring des événements et alertes du système</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
            >
              {isNotificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={markAllAsRead}>
              Marquer tout lu
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={clearAllAlerts}>
              Effacer tout
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex space-x-2">
          {(['all', 'error', 'warning', 'info'] as const).map((filter) => (
            <Button
              type="button"
              key={filter}
              size="sm"
              variant={selectedFilter === filter ? 'default' : 'outline'}
              onClick={() => setSelectedFilter(filter)}
              className="text-xs"
            >
              {filter === 'all' && 'Toutes'}
              {filter === 'error' && 'Erreurs'}
              {filter === 'warning' && 'Avertissements'}
              {filter === 'info' && 'Informations'}
              {filter !== 'all' && (
                <span className="ml-1">
                  ({currentAlerts?.filter((a) => a.type === filter).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Liste des alertes */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAlerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <p>Aucune alerte système</p>
              <p className="text-sm">Tout fonctionne correctement</p>
            </div>
          ) : (
            filteredAlerts?.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start space-x-3 p-3 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} ${
                  alert.isRead ? 'bg-muted/50' : 'bg-background'
                } hover:bg-muted/30 transition-colors`}
              >
                <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4
                          className={`text-sm font-medium ${alert.isRead ? 'text-muted-foreground' : ''}`}
                        >
                          {alert.title}
                        </h4>
                        <Badge
                          variant={
                            getAlertBadgeVariant(alert.type) as
                              | 'default'
                              | 'secondary'
                              | 'destructive'
                              | 'outline'
                          }
                          className="text-xs"
                        >
                          {alert.type}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          {getSourceIcon(alert.source)}
                          <span>{alert?.source?.toUpperCase()}</span>
                        </div>
                      </div>
                      <p
                        className={`text-sm ${alert.isRead ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      {!alert.isRead && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Résumé */}
        {currentAlerts.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <span>
              {currentAlerts.length} alerte{currentAlerts.length > 1 ? 's' : ''} au total
            </span>
            <span>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
