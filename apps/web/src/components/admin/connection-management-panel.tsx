'use client'

import { Badge, Button, Card, CardContent } from '@erp/ui'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'

interface ConnectionInfo {
  tenant: string
  isInitialized: boolean
  createdAt?: string
  lastActivity?: string
  queryCount?: number
  activeQueries?: number
  poolSize?: number
  status?: 'active' | 'idle' | 'error'
  isCurrent?: boolean
}

interface ConnectionManagementPanelProps {
  connections: ConnectionInfo[]
  onViewDetails?: (tenant: string) => void
  onCloseConnection?: (tenant: string) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export default function ConnectionManagementPanel({
  connections,
  onViewDetails,
  onCloseConnection,
  onRefresh,
  isLoading = false,
}: ConnectionManagementPanelProps) {
  const [selectedConnection, setSelectedConnection] = useState<string>('')
  const [_viewMode, _setViewMode] = useState<'list' | 'grid'>('list')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'error'>('all')

  const getStatusIcon = (connection: ConnectionInfo) => {
    if (!connection.isInitialized) {
      return <WifiOff className="w-4 h-4 text-red-600" />
    }

    switch (connection.status) {
      case 'active':
        return <Wifi className="w-4 h-4 text-green-600" />
      case 'idle':
        return <Wifi className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-600" />
      default:
        return <Wifi className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadge = (connection: ConnectionInfo) => {
    if (!connection.isInitialized) {
      return (
        <Badge variant="destructive" className="text-xs">
          Non initialisée
        </Badge>
      )
    }

    switch (connection.status) {
      case 'active':
        return (
          <Badge variant="success" className="text-xs">
            Active
          </Badge>
        )
      case 'idle':
        return (
          <Badge variant="warning" className="text-xs">
            Inactive
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="text-xs">
            Connectée
          </Badge>
        )
    }
  }

  const getConnectionHealth = (connection: ConnectionInfo) => {
    if (!connection.isInitialized) return 'unhealthy'
    if (connection.status === 'error') return 'unhealthy'
    if (connection.status === 'active') return 'healthy'
    return 'degraded'
  }

  const formatDuration = (dateString?: string) => {
    if (!dateString) return 'N/A'

    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}j ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const filteredConnections = connections.filter((conn) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return conn.isInitialized && conn.status === 'active'
    if (filterStatus === 'idle') return conn.isInitialized && conn.status === 'idle'
    if (filterStatus === 'error') return !conn.isInitialized || conn.status === 'error'
    return true
  })

  const getStatsColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-red-600'
    if (value >= threshold * 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestion des Connexions</h3>
          <p className="text-sm text-muted-foreground">
            {connections.length} connexion{connections.length !== 1 ? 's' : ''} tenant
            {filteredConnections.length !== connections.length &&
              ` (${filteredConnections.length} affiché${filteredConnections.length !== 1 ? 's' : ''})`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border">
            {(['all', 'active', 'idle', 'error'] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={filterStatus === filter ? 'default' : 'ghost'}
                onClick={() => setFilterStatus(filter)}
                className="text-xs border-0 rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {filter === 'all' && 'Toutes'}
                {filter === 'active' && 'Actives'}
                {filter === 'idle' && 'Inactives'}
                {filter === 'error' && 'Erreurs'}
                <span className="ml-1">
                  (
                  {filter === 'all'
                    ? connections.length
                    : connections.filter((c) =>
                        filter === 'active'
                          ? c.isInitialized && c.status === 'active'
                          : filter === 'idle'
                            ? c.isInitialized && c.status === 'idle'
                            : filter === 'error'
                              ? !c.isInitialized || c.status === 'error'
                              : true
                      ).length}
                  )
                </span>
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {connections.filter((c) => c.isInitialized).length}
                </div>
                <div className="text-xs text-muted-foreground">Initialisées</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {connections.filter((c) => c.status === 'active').length}
                </div>
                <div className="text-xs text-muted-foreground">Actives</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {connections.reduce((sum, c) => sum + (c.queryCount || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Requêtes total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {connections.reduce((sum, c) => sum + (c.activeQueries || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Requêtes actives</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des connexions */}
      {filteredConnections.length > 0 ? (
        <div className="space-y-3">
          {filteredConnections.map((connection, index) => (
            <Card
              key={index}
              className={`hover:shadow-md transition-shadow ${
                selectedConnection === connection.tenant ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">
                          Tenant: {connection.tenant}
                          {connection.isCurrent && (
                            <Badge variant="default" className="ml-2 text-xs">
                              Session active
                            </Badge>
                          )}
                        </h4>
                        {getStatusIcon(connection)}
                        {getStatusBadge(connection)}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {connection.createdAt && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Créé: {formatDuration(connection.createdAt)}</span>
                          </span>
                        )}

                        {connection.lastActivity && (
                          <span className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>Activité: {formatDuration(connection.lastActivity)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Métriques en temps réel */}
                    <div className="hidden md:flex items-center space-x-4 text-sm">
                      {connection.queryCount !== undefined && (
                        <div className="text-center">
                          <div
                            className={`font-mono ${getStatsColor(connection.queryCount, 1000)}`}
                          >
                            {connection.queryCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Requêtes</div>
                        </div>
                      )}

                      {connection.activeQueries !== undefined && (
                        <div className="text-center">
                          <div
                            className={`font-mono ${getStatsColor(connection.activeQueries, 10)}`}
                          >
                            {connection.activeQueries}
                          </div>
                          <div className="text-xs text-muted-foreground">Actives</div>
                        </div>
                      )}

                      {connection.poolSize !== undefined && (
                        <div className="text-center">
                          <div className={`font-mono ${getStatsColor(connection.poolSize, 20)}`}>
                            {connection.poolSize}
                          </div>
                          <div className="text-xs text-muted-foreground">Pool</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConnection(
                            selectedConnection === connection.tenant ? '' : connection.tenant
                          )
                          onViewDetails?.(connection.tenant)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCloseConnection?.(connection.tenant)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Détails étendus */}
                {selectedConnection === connection.tenant && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Statut de Santé</h5>
                        <div className="flex items-center space-x-2">
                          {getConnectionHealth(connection) === 'healthy' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {getConnectionHealth(connection) === 'degraded' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                          {getConnectionHealth(connection) === 'unhealthy' && (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {getConnectionHealth(connection) === 'healthy' && 'Excellent'}
                            {getConnectionHealth(connection) === 'degraded' && 'Dégradé'}
                            {getConnectionHealth(connection) === 'unhealthy' && 'Problématique'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Configuration</h5>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Base: erp_topsteel_{connection.tenant}</div>
                          <div>Pool: {connection.poolSize || 'N/A'} connexions</div>
                          <div>Timeout: 30s</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Actions Rapides</h5>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            Configurer
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Redémarrer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {connections.length === 0
                ? 'Aucune connexion tenant active'
                : 'Aucune connexion ne correspond aux filtres'}
            </p>
            {connections.length === 0 && (
              <Button size="sm" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Créer une connexion
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
