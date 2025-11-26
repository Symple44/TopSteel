'use client'

export const dynamic = 'force-dynamic'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import {
  Activity,
  BarChart3,
  Database,
  HardDrive,
  PlayCircle,
  RefreshCw,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConnectionManagementPanel } from '../../../../components/admin/connection-management-panel'
import { DatabaseMonitoringCard } from '../../../../components/admin/database-monitoring-card'
import { MigrationStatusCard } from '../../../../components/admin/migration-status-card'
import { PerformanceMetricsChart } from '../../../../components/admin/performance-metrics-chart'
import { SystemAlertsPanel } from '../../../../components/admin/system-alerts-panel'
import { useToastShortcuts } from '../../../../hooks/use-toast'
import { useTranslation } from '../../../../lib/i18n/hooks'
import { callClientApi } from '../../../../utils/backend-api'

// Types pour la nouvelle architecture multi-tenant
interface DatabaseHealthStatus {
  database: string
  status: 'healthy' | 'unhealthy'
  isConnected: boolean
  responseTime?: number
  error?: string
}

interface SystemDatabaseHealth {
  auth: DatabaseHealthStatus
  shared: DatabaseHealthStatus
  tenant: DatabaseHealthStatus
  activeTenants: string[]
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
}

interface MigrationStatus {
  database: string
  pending: string[]
  executed: string[]
  status: 'up-to-date' | 'pending' | 'error'
  error?: string
}

interface ConnectionInfo {
  tenant: string
  isInitialized: boolean
  isCurrent?: boolean
}

interface ConnectionsData {
  connections: ConnectionInfo[]
  timestamp: string
}

export default function DatabaseManagementPage() {
  const { t: tDb } = useTranslation('admin')
  const [systemHealth, setSystemHealth] = useState<SystemDatabaseHealth | null>(null)
  const [migrationStatuses, setMigrationStatuses] = useState<MigrationStatus[]>([])
  const [connections, setConnections] = useState<ConnectionsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [tenantHealth, setTenantHealth] = useState<DatabaseHealthStatus | null>(null)
  const [tenantMigrations, setTenantMigrations] = useState<MigrationStatus | null>(null)

  const { success, error } = useToastShortcuts()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [healthResponse, migrationsResponse, connectionsResponse] = await Promise.all([
        callClientApi('admin/database/health'),
        callClientApi('admin/database/migrations/status'),
        callClientApi('admin/database/connections'),
      ])

      if (healthResponse.ok) {
        const healthData = await healthResponse?.json()
        setSystemHealth(healthData)
      }

      if (migrationsResponse.ok) {
        const migrationsData = await migrationsResponse?.json()
        setMigrationStatuses(migrationsData)
      }

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse?.json()
        setConnections(connectionsData)
      }
    } catch (_err) {
      error('Erreur de chargement', 'Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }, [error])

  const loadTenantData = useCallback(async (tenantCode: string) => {
    try {
      const [healthResponse, migrationsResponse] = await Promise.all([
        callClientApi(`admin/database/health/tenant/${tenantCode}`),
        callClientApi(`admin/database/migrations/tenant/${tenantCode}/status`),
      ])

      if (healthResponse.ok) {
        const healthData = await healthResponse?.json()
        setTenantHealth(healthData)
      }

      if (migrationsResponse.ok) {
        const migrationsData = await migrationsResponse?.json()
        setTenantMigrations(migrationsData)
      }
    } catch (_err) {}
  }, [])

  useEffect(() => {
    loadData()
    // Actualisation automatique désactivée
    // const interval = setInterval(loadData, 30000)
    // return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    if (selectedTenant) {
      loadTenantData(selectedTenant)
    }
  }, [selectedTenant, loadTenantData])

  const handleRunAllMigrations = async () => {
    setLoading(true)
    try {
      const response = await callClientApi('admin/database/migrations/run', {
        method: 'POST',
      })

      const result = await response?.json()

      if (response?.ok) {
        success(tDb('database.migrationsExecuted'), tDb('database.migrationsSuccess'))
        loadData()
      } else {
        error(
          tDb('database.migrationError'),
          result?.message || "Impossible d'exécuter les migrations"
        )
      }
    } catch (_err) {
      error(tDb('database.migrationError'), "Impossible d'exécuter les migrations")
    } finally {
      setLoading(false)
    }
  }

  const handleRunTenantMigrations = async (tenantCode: string) => {
    setLoading(true)
    try {
      const response = await callClientApi(`admin/database/migrations/tenant/${tenantCode}/run`, {
        method: 'POST',
      })

      const result = await response?.json()

      if (response?.ok) {
        success(
          tDb('database.migrationTenantExecuted'),
          `Migrations exécutées pour le tenant ${tenantCode}`
        )
        loadTenantData(tenantCode)
        loadData()
      } else {
        error(
          'Erreur de migration tenant',
          result?.message || "Impossible d'exécuter les migrations du tenant"
        )
      }
    } catch (_err) {
      error('Erreur de migration', "Impossible d'exécuter les migrations du tenant")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseTenantConnection = async (tenantCode: string) => {
    try {
      const response = await callClientApi(
        `admin/database/connections/tenant/${tenantCode}/close`,
        {
          method: 'POST',
        }
      )

      if (response?.ok) {
        success(tDb('database.connectionClosed'), `Connexion fermée pour le tenant ${tenantCode}`)
        loadData()
      } else {
        error(tDb('database.error'), 'Impossible de fermer la connexion')
      }
    } catch (_err) {
      error(tDb('database.error'), 'Impossible de fermer la connexion')
    }
  }

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'healthy':
      case 'up-to-date':
        return 'secondary' // Badge doesn't have 'success', use 'secondary' for good status
      case 'degraded':
      case 'pending':
        return 'outline' // Use 'outline' for warning-like status
      case 'unhealthy':
      case 'error':
        return 'destructive'
      default:
        return 'default'
    }
  }

  if (loading && !systemHealth) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>{tDb('database.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">{tDb('database.title')}</h1>
            <p className="text-muted-foreground mt-1">{tDb('database.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="button" onClick={loadData} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {tDb('database.refresh')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted p-1 rounded-lg">
          <TabsTrigger value="overview">{tDb('database.overview')}</TabsTrigger>
          <TabsTrigger value="migrations">{tDb('database.migrations')}</TabsTrigger>
          <TabsTrigger value="connections">{tDb('database.connections')}</TabsTrigger>
          <TabsTrigger value="tenants">{tDb('database.tenants')}</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          {systemHealth && (
            <>
              {/* Status global */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>{tDb('database.systemStatus')}</span>
                      </CardTitle>
                      <CardDescription>
                        {tDb('database.lastCheck')}{' '}
                        {new Date(systemHealth.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(systemHealth.overallStatus)}
                      className="text-lg px-4 py-2"
                    >
                      {systemHealth?.overallStatus?.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Auth Database */}
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          AUTH
                        </h3>
                        <Badge variant={getStatusBadgeVariant(systemHealth?.auth?.status)}>
                          {systemHealth?.auth?.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tDb('database.connection')}</span>
                          {systemHealth?.auth?.isConnected ? (
                            <Wifi className="w-4 h-4 text-green-600" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {systemHealth?.auth?.responseTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span>{tDb('database.responseTime')}</span>
                            <span className="font-mono">
                              {systemHealth?.auth?.responseTime?.toFixed(2)}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shared Database */}
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          SHARED
                        </h3>
                        <Badge variant={getStatusBadgeVariant(systemHealth?.shared?.status)}>
                          {systemHealth?.shared?.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tDb('database.connection')}</span>
                          {systemHealth?.shared?.isConnected ? (
                            <Wifi className="w-4 h-4 text-green-600" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {systemHealth?.shared?.responseTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span>{tDb('database.responseTime')}</span>
                            <span className="font-mono">
                              {systemHealth?.shared?.responseTime?.toFixed(2)}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tenant Database */}
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          TENANT
                        </h3>
                        <Badge variant={getStatusBadgeVariant(systemHealth?.tenant?.status)}>
                          {systemHealth?.tenant?.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tDb('database.connection')}</span>
                          {systemHealth?.tenant?.isConnected ? (
                            <Wifi className="w-4 h-4 text-green-600" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {systemHealth?.tenant?.responseTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span>{tDb('database.responseTime')}</span>
                            <span className="font-mono">
                              {systemHealth?.tenant?.responseTime?.toFixed(2)}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tDb('database.activeTenants')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemHealth?.activeTenants?.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {systemHealth?.activeTenants?.join(', ')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tDb('database.connections')}
                    </CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {connections ? connections?.connections?.length : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tDb('database.connectionsActive')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tDb('database.migrations')}
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {migrationStatuses?.filter((m) => m.status === 'pending').length}
                    </div>
                    <p className="text-xs text-muted-foreground">{tDb('database.pending')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tDb('database.performance')}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        ((systemHealth?.auth?.responseTime ?? 0) +
                          (systemHealth?.shared?.responseTime ?? 0) +
                          (systemHealth?.tenant?.responseTime ?? 0)) /
                        3
                      ).toFixed(2)}
                      ms
                    </div>
                    <p className="text-xs text-muted-foreground">{tDb('database.averageTime')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Composants de monitoring avancés */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Métriques de performance */}
                <div className="space-y-4">
                  <PerformanceMetricsChart data={[]} autoRefresh={false} />
                </div>

                {/* Alertes système */}
                <div className="space-y-4">
                  <SystemAlertsPanel alerts={[]} autoRefresh={false} maxAlerts={5} />
                </div>
              </div>

              {/* Cartes de monitoring détaillées */}
              {systemHealth && (
                <div className="grid md:grid-cols-3 gap-4">
                  <DatabaseMonitoringCard
                    metrics={{
                      database: 'AUTH',
                      status: systemHealth?.auth?.status,
                      isConnected: systemHealth?.auth?.isConnected,
                      responseTime: systemHealth?.auth?.responseTime,
                      error: systemHealth?.auth?.error,
                    }}
                    variant="auth"
                  />
                  <DatabaseMonitoringCard
                    metrics={{
                      database: 'SHARED',
                      status: systemHealth?.shared?.status,
                      isConnected: systemHealth?.shared?.isConnected,
                      responseTime: systemHealth?.shared?.responseTime,
                      error: systemHealth?.shared?.error,
                    }}
                    variant="shared"
                  />
                  <DatabaseMonitoringCard
                    metrics={{
                      database: 'TENANT',
                      status: systemHealth?.tenant?.status,
                      isConnected: systemHealth?.tenant?.isConnected,
                      responseTime: systemHealth?.tenant?.responseTime,
                      error: systemHealth?.tenant?.error,
                    }}
                    variant="tenant"
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Migrations */}
        <TabsContent value="migrations" className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{tDb('database.migrationsManagement')}</h2>
              <p className="text-muted-foreground">{tDb('database.migrationsDescription')}</p>
            </div>
            <Button type="button" onClick={handleRunAllMigrations} disabled={loading}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {tDb('database.executeAllMigrations')}
            </Button>
          </div>

          {/* Cartes de migration améliorées */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {migrationStatuses?.map((migration) => {
              // Déterminer le variant basé sur le nom de la base
              let variant: 'auth' | 'shared' | 'tenant' = 'tenant'
              if (migration?.database?.toLowerCase().includes('auth')) variant = 'auth'
              else if (migration?.database?.toLowerCase().includes('shared')) variant = 'shared'

              return (
                <MigrationStatusCard
                  key={migration.database}
                  database={migration.database}
                  status={migration.status}
                  executed={migration.executed}
                  pending={migration.pending}
                  error={migration.error}
                  variant={variant}
                  isLoading={loading}
                  onRunMigrations={() => {
                    if (migration?.database?.startsWith('tenant_')) {
                      const tenantCode = migration?.database?.replace('tenant_', '')
                      handleRunTenantMigrations(tenantCode)
                    } else {
                      handleRunAllMigrations()
                    }
                  }}
                />
              )
            })}
          </div>

          {/* Résumé global des migrations */}
          {migrationStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tDb('database.globalSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {migrationStatuses.length}
                    </div>
                    <div className="text-sm text-muted-foreground">{tDb('database.databases')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {migrationStatuses?.reduce((sum, m) => sum + m?.executed?.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tDb('database.executedMigrations')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {migrationStatuses?.reduce((sum, m) => sum + m?.pending?.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tDb('database.pendingMigrations')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {migrationStatuses?.filter((m) => m.status === 'error').length}
                    </div>
                    <div className="text-sm text-muted-foreground">{tDb('database.errors')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* État vide */}
          {migrationStatuses.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{tDb('database.noMigrations')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {tDb('database.noMigrationsDescription')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Connexions */}
        <TabsContent value="connections" className="space-y-4">
          <ConnectionManagementPanel
            connections={
              connections?.connections?.map((conn) => ({
                tenant: conn.tenant,
                isInitialized: conn.isInitialized,
                status: conn.isInitialized ? ('active' as const) : ('error' as const),
                isCurrent: conn.isCurrent,
              })) || []
            }
            onViewDetails={(tenant) => setSelectedTenant(tenant)}
            onCloseConnection={handleCloseTenantConnection}
            onRefresh={loadData}
            isLoading={loading}
          />
        </TabsContent>

        {/* Gestion des Tenants */}
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tDb('database.tenantsManagement')}</CardTitle>
              <CardDescription>{tDb('database.selectTenant')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{tDb('database.selectTenantLabel')}</span>
                  <select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e?.target?.value)}
                    className="border rounded px-3 py-1"
                  >
                    <option value="">{tDb('database.selectTenantPlaceholder')}</option>
                    {systemHealth?.activeTenants?.map((tenant) => (
                      <option key={tenant} value={tenant}>
                        {tenant}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTenant && tenantHealth && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{tDb('database.tenantHealth')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Status</span>
                            <Badge variant={getStatusBadgeVariant(tenantHealth.status)}>
                              {tenantHealth.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{tDb('database.connection')}</span>
                            {tenantHealth.isConnected ? (
                              <Wifi className="w-4 h-4 text-green-600" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          {tenantHealth.responseTime && (
                            <div className="flex items-center justify-between">
                              <span>{tDb('database.responseTime')}</span>
                              <span className="font-mono">
                                {tenantHealth?.responseTime?.toFixed(2)}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{tDb('database.configuration')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>{tDb('database.base')}</span>
                            <span className="font-mono text-sm">
                              {(tenantHealth as { configuration?: { database?: string } })
                                ?.configuration?.database ||
                                `erp_topsteel_${selectedTenant?.toLowerCase()}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{tDb('database.pool')}</span>
                            <span className="font-mono">
                              {(tenantHealth as { configuration?: { poolSize?: number } })
                                ?.configuration?.poolSize || 10}{' '}
                              {tDb('database.connectionsLabel')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{tDb('database.timeout')}</span>
                            <span className="font-mono">
                              {((tenantHealth as { configuration?: { connectionTimeout?: number } })
                                ?.configuration?.connectionTimeout || 30000) / 1000}
                              s
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {tenantMigrations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{tDb('database.migrations')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span>Status</span>
                              <Badge variant={getStatusBadgeVariant(tenantMigrations.status)}>
                                {tenantMigrations.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{tDb('database.executed')}</span>
                              <span>{tenantMigrations?.executed?.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{tDb('database.pending')}</span>
                              <span>{tenantMigrations?.pending?.length}</span>
                            </div>
                            {tenantMigrations?.pending?.length > 0 && (
                              <Button
                                type="button"
                                onClick={() => handleRunTenantMigrations(selectedTenant)}
                                size="sm"
                                className="w-full"
                              >
                                {tDb('database.executeMigrations')}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
