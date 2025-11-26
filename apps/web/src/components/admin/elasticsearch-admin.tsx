'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  useFormFieldIds,
} from '@erp/ui'
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Server,
  Settings,
  Shield,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '../../lib/i18n'
import { callClientApi } from '../../utils/backend-api'

interface ElasticsearchStatus {
  connected: boolean
  error?: string
  version?: string
  clusterName?: string
  indices: Record<
    string,
    {
      exists: boolean
      documentCount?: number
      status: 'healthy' | 'error'
      error?: string
    }
  >
}

interface ElasticsearchConfig {
  url: string
  username: string
  password: string
  enableAuth: boolean
  indexPrefix: string
  maxRetries: number
  requestTimeout: number
  batchSize: number
  enableLogging: boolean
}

export function ElasticsearchAdmin() {
  const ids = useFormFieldIds([
    'elasticsearch-url',
    'elasticsearch-prefix',
    'enable-auth',
    'elasticsearch-username',
    'elasticsearch-password',
    'max-retries',
    'request-timeout',
    'batch-size',
    'enable-logging',
  ])
  const { t } = useTranslation('admin')
  const [status, setStatus] = useState<ElasticsearchStatus | null>(null)
  const [config, setConfig] = useState<ElasticsearchConfig>({
    url: '',
    username: '',
    password: '',
    enableAuth: false,
    indexPrefix: 'topsteel',
    maxRetries: 3,
    requestTimeout: 30000,
    batchSize: 100,
    enableLogging: false,
  })
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [hasConfigChanges, setHasConfigChanges] = useState(false)
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0)

  const fetchStatus = useCallback(
    async (force = false) => {
      // Cache simple : éviter les appels répétés dans les 30 secondes
      const now = Date.now()
      if (!force && now - lastStatusCheck < 30000 && status) {
        setLoading(false)
        return
      }

      try {
        const response = await callClientApi('admin/elasticsearch?action=status')
        const data = await response?.json()
        setStatus(data)
        setLastStatusCheck(now)
      } catch {
        toast?.error(t('elasticsearch.statusError'))
      } finally {
        setLoading(false)
      }
    },
    [lastStatusCheck, status, t]
  )

  const fetchConfig = useCallback(async () => {
    try {
      const response = await callClientApi(
        'admin/system-parameters/by-category?category=ELASTICSEARCH'
      )
      const data = await response?.json()

      // Toujours initialiser avec les valeurs par défaut
      const defaultConfig = {
        url: 'http://localhost:9200',
        username: '',
        password: '',
        enableAuth: false,
        indexPrefix: 'topsteel',
        maxRetries: 3,
        requestTimeout: 30000,
        batchSize: 100,
        enableLogging: false,
      }

      if (data?.length > 0) {
        const configFromParams = data?.reduce(
          (acc: ElasticsearchConfig, param: { key: string; value: string }) => {
            switch (param.key) {
              case 'elasticsearch.url':
                acc.url = param.value || defaultConfig.url
                break
              case 'elasticsearch.username':
                acc.username = param.value || defaultConfig.username
                break
              case 'elasticsearch.password':
                acc.password = param.value || defaultConfig.password
                break
              case 'elasticsearch.enableAuth':
                acc.enableAuth = param.value === 'true'
                break
              case 'elasticsearch.indexPrefix':
                acc.indexPrefix = param.value || defaultConfig.indexPrefix
                break
              case 'elasticsearch.maxRetries':
                acc.maxRetries = parseInt(param.value, 10) || defaultConfig.maxRetries
                break
              case 'elasticsearch.requestTimeout':
                acc.requestTimeout = parseInt(param.value, 10) || defaultConfig.requestTimeout
                break
              case 'elasticsearch.batchSize':
                acc.batchSize = parseInt(param.value, 10) || defaultConfig.batchSize
                break
              case 'elasticsearch.enableLogging':
                acc.enableLogging = param.value === 'true'
                break
            }
            return acc
          },
          defaultConfig
        )

        setConfig((prev) => ({ ...prev, ...configFromParams }))
      } else {
        // Si aucune configuration n'est trouvée, utiliser les valeurs par défaut
        setConfig((prev) => ({ ...prev, ...defaultConfig }))
      }
    } catch {
      toast?.error('Erreur de configuration Elasticsearch')
    }
  }, []) // Removed t dependency to prevent infinite loop

  const saveConfig = async () => {
    setConfigLoading(true)
    try {
      const updates = [
        { key: 'elasticsearch.url', value: config.url },
        { key: 'elasticsearch.username', value: config.username },
        { key: 'elasticsearch.password', value: config.password },
        { key: 'elasticsearch.enableAuth', value: config?.enableAuth?.toString() },
        { key: 'elasticsearch.indexPrefix', value: config.indexPrefix },
        { key: 'elasticsearch.maxRetries', value: config?.maxRetries?.toString() },
        { key: 'elasticsearch.requestTimeout', value: config?.requestTimeout?.toString() },
        { key: 'elasticsearch.batchSize', value: config?.batchSize?.toString() },
        { key: 'elasticsearch.enableLogging', value: config?.enableLogging?.toString() },
      ]

      const response = await callClientApi('admin/system-parameters', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (response?.ok) {
        await response?.json()
        toast?.success(t('elasticsearch.configurationSaved'))
        setHasConfigChanges(false)
        // Rafraîchir la configuration et le statut pour voir les changements
        await fetchConfig()
        await fetchStatus(true)
      } else {
        await response?.json()
        throw new Error(`Erreur lors de la sauvegarde: ${response?.status}`)
      }
    } catch {
      toast?.error(t('elasticsearch.configurationError'))
    } finally {
      setConfigLoading(false)
    }
  }

  const resetToDefaults = async () => {
    if (confirm(t('resetConfirm'))) {
      setConfigLoading(true)
      try {
        const defaultConfig = {
          url: 'http://localhost:9200',
          username: '',
          password: '',
          enableAuth: false,
          indexPrefix: 'topsteel',
          maxRetries: 3,
          requestTimeout: 30000,
          batchSize: 100,
          enableLogging: false,
        }

        const updates = [
          { key: 'elasticsearch.url', value: defaultConfig.url },
          { key: 'elasticsearch.username', value: defaultConfig.username },
          { key: 'elasticsearch.password', value: defaultConfig.password },
          { key: 'elasticsearch.enableAuth', value: defaultConfig?.enableAuth?.toString() },
          { key: 'elasticsearch.indexPrefix', value: defaultConfig.indexPrefix },
          { key: 'elasticsearch.maxRetries', value: defaultConfig?.maxRetries?.toString() },
          { key: 'elasticsearch.requestTimeout', value: defaultConfig?.requestTimeout?.toString() },
          { key: 'elasticsearch.batchSize', value: defaultConfig?.batchSize?.toString() },
          { key: 'elasticsearch.enableLogging', value: defaultConfig?.enableLogging?.toString() },
        ]

        const response = await callClientApi('admin/system-parameters', {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        if (response?.ok) {
          toast?.success(t('resetSuccess'))
          setHasConfigChanges(false)
          // Rafraîchir la configuration et le statut pour voir les changements
          await fetchConfig()
          await fetchStatus(true)
        } else {
          throw new Error(`Erreur lors de la réinitialisation: ${response?.status}`)
        }
      } catch {
        toast?.error(t('resetError'))
      } finally {
        setConfigLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchConfig()
  }, [fetchConfig, fetchStatus])

  const runMigrations = async () => {
    setOperationLoading('migrate')
    try {
      const response = await callClientApi('admin/elasticsearch', {
        method: 'POST',
        body: JSON.stringify({ action: 'migrate' }),
      })

      const result = await response?.json()

      if (result?.success) {
        toast?.success(t('elasticsearch.migrationsSuccess'))
        await fetchStatus(true)
      } else {
        toast?.error(t('elasticsearch.migrationsError'))
      }
    } catch {
      toast?.error(t('elasticsearch.migrationsError'))
    } finally {
      setOperationLoading(null)
    }
  }

  const resetIndex = async (indexName: string) => {
    if (!confirm(t('elasticsearch.resetConfirm').replace('{indexName}', indexName))) {
      return
    }

    setOperationLoading(`reset-${indexName}`)
    try {
      const response = await callClientApi('admin/elasticsearch', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', indexName }),
      })

      const result = await response?.json()

      if (result?.success) {
        toast?.success(t('elasticsearch.resetSuccess').replace('{indexName}', indexName))
        await fetchStatus(true)
      } else {
        toast?.error(t('elasticsearch.resetError').replace('{indexName}', indexName))
      }
    } catch {
      toast?.error(t('elasticsearch.resetError').replace('{indexName}', indexName))
    } finally {
      setOperationLoading(null)
    }
  }

  const getStatusBadge = (connected: boolean) => {
    if (connected) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('elasticsearch.connected')}
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {t('elasticsearch.disconnected')}
        </Badge>
      )
    }
  }

  const getIndexStatusBadge = (index: {
    exists: boolean
    health?: string
    status?: string
    docsCount?: number
  }) => {
    if (!index.exists) {
      return (
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('elasticsearch.indexNotCreated')}
        </Badge>
      )
    }

    if (index.status === 'healthy') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('elasticsearch.indexActive')} ({index.docsCount || 0} docs)
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {t('elasticsearch.indexError')}
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('elasticsearch.loadingStatus')}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Elasticsearch</h2>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefaults}
            disabled={configLoading}
          >
            {configLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {t('common.reset')}
          </Button>
          <Button type="button" onClick={saveConfig} disabled={!hasConfigChanges || configLoading}>
            {configLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Statut de connexion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Elasticsearch - {t('elasticsearch.status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-medium">{t('elasticsearch.connectionStatus')}</p>
                <p className="text-sm text-muted-foreground">
                  {config.url || 'http://localhost:9200 (par défaut)'}
                </p>
                {status?.connected && status.version && (
                  <p className="text-xs text-muted-foreground">
                    {t('elasticsearch.version')}: {status.version}
                    {status.clusterName &&
                      ` • ${t('elasticsearch.cluster')}: ${status.clusterName}`}
                  </p>
                )}
                {status?.error && !status.connected && (
                  <p className="text-xs text-red-600">
                    {t('elasticsearch.error')}: {status.error}
                  </p>
                )}
              </div>
              {status && getStatusBadge(status.connected)}
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchStatus(true)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('elasticsearch.refresh')}
              </Button>

              {status?.connected && (
                <Button
                  type="button"
                  onClick={runMigrations}
                  disabled={operationLoading === 'migrate'}
                >
                  {operationLoading === 'migrate' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {t('elasticsearch.migrations')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statut des index */}
      {status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              {t('elasticsearch.indices')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(status.indices).map(([indexName, indexInfo]) => (
                <div
                  key={indexName}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{indexName}</p>
                      <p className="text-sm text-muted-foreground">
                        {indexInfo.error || "Index pour la recherche d'images"}
                      </p>
                    </div>
                    {getIndexStatusBadge(indexInfo)}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => resetIndex(indexName)}
                      disabled={operationLoading === `reset-${indexName}`}
                    >
                      {operationLoading === `reset-${indexName}` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4 mr-2" />
                      )}
                      {t('elasticsearch.reset')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration des paramètres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            {t('elasticsearch.configuration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connexion */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <h3 className="font-medium">{t('elasticsearch.connection')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={ids['elasticsearch-url']}>{t('elasticsearch.serverUrl')}</Label>
                <Input
                  id={ids['elasticsearch-url']}
                  type="url"
                  placeholder="http://localhost:9200"
                  value={config.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({ ...prev, url: e?.target?.value }))
                    setHasConfigChanges(true)
                  }}
                />
              </div>
              <div>
                <Label htmlFor={ids['elasticsearch-prefix']}>
                  {t('elasticsearch.indexPrefix')}
                </Label>
                <Input
                  id={ids['elasticsearch-prefix']}
                  placeholder="topsteel"
                  value={config.indexPrefix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({ ...prev, indexPrefix: e?.target?.value }))
                    setHasConfigChanges(true)
                  }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Authentification */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <h3 className="font-medium">{t('elasticsearch.authentication')}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id={ids['enable-auth']}
                  checked={config.enableAuth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({ ...prev, enableAuth: e?.target?.checked }))
                    setHasConfigChanges(true)
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${config.enableAuth ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${config.enableAuth ? 'translate-x-5' : 'translate-x-0'} mt-0.5`}
                  />
                </div>
              </label>
              <Label htmlFor={ids['enable-auth']}>{t('elasticsearch.enableAuth')}</Label>
            </div>

            {config.enableAuth && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={ids['elasticsearch-username']}>
                    {t('elasticsearch.username')}
                  </Label>
                  <Input
                    id={ids['elasticsearch-username']}
                    value={config.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setConfig((prev) => ({ ...prev, username: e?.target?.value }))
                      setHasConfigChanges(true)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={ids['elasticsearch-password']}>
                    {t('elasticsearch.password')}
                  </Label>
                  <Input
                    id={ids['elasticsearch-password']}
                    type="password"
                    value={config.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setConfig((prev) => ({ ...prev, password: e?.target?.value }))
                      setHasConfigChanges(true)
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Paramètres avancés */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <h3 className="font-medium">{t('elasticsearch.advancedSettings')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={ids['max-retries']}>{t('elasticsearch.maxRetries')}</Label>
                <Input
                  id={ids['max-retries']}
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxRetries}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({
                      ...prev,
                      maxRetries: parseInt(e?.target?.value, 10) || 3,
                    }))
                    setHasConfigChanges(true)
                  }}
                />
              </div>
              <div>
                <Label htmlFor={ids['request-timeout']}>{t('elasticsearch.timeout')}</Label>
                <Input
                  id={ids['request-timeout']}
                  type="number"
                  min="1000"
                  max="120000"
                  value={config.requestTimeout}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({
                      ...prev,
                      requestTimeout: parseInt(e?.target?.value, 10) || 30000,
                    }))
                    setHasConfigChanges(true)
                  }}
                />
              </div>
              <div>
                <Label htmlFor={ids['batch-size']}>{t('elasticsearch.batchSize')}</Label>
                <Input
                  id={ids['batch-size']}
                  type="number"
                  min="1"
                  max="1000"
                  value={config.batchSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({
                      ...prev,
                      batchSize: parseInt(e?.target?.value, 10) || 100,
                    }))
                    setHasConfigChanges(true)
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id={ids['enable-logging']}
                  checked={config.enableLogging}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig((prev) => ({ ...prev, enableLogging: e?.target?.checked }))
                    setHasConfigChanges(true)
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${config.enableLogging ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${config.enableLogging ? 'translate-x-5' : 'translate-x-0'} mt-0.5`}
                  />
                </div>
              </label>
              <Label htmlFor={ids['enable-logging']}>{t('elasticsearch.enableLogging')}</Label>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasConfigChanges && (
            <div className="text-sm text-orange-600">{t('elasticsearch.unsavedChanges')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
