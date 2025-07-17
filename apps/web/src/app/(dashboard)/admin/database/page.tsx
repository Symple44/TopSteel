'use client'

import { useState, useEffect } from 'react'
import { Button } from '@erp/ui'
import { Badge } from '@erp/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Progress } from '@erp/ui'
import { useToastShortcuts } from '@/hooks/use-toast'
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  History,
  Shield,
  HardDrive,
  PlayCircle,
  Settings,
  FileDown,
  Clock,
  Activity,
  Trash2
} from 'lucide-react'

interface TableInfo {
  name: string
  expected: boolean
  exists: boolean
  columns?: string[]
  status: 'ok' | 'missing' | 'extra' | 'error'
  rowCount?: number
  size?: string
}

interface DatabaseIntegrityReport {
  expectedTables: string[]
  actualTables: string[]
  tableDetails: TableInfo[]
  summary: {
    total: number
    ok: number
    missing: number
    extra: number
    errors: number
  }
  canSynchronize: boolean
}

interface ConnectionStatus {
  connected: boolean
  version?: string
  error?: string
  host?: string
  port?: number
  database?: string
  uptime?: string
}

interface BackupInfo {
  id: string
  filename: string
  createdAt: string
  size: string
  type: 'manual' | 'scheduled'
  status: 'completed' | 'in-progress' | 'failed'
}

interface DatabaseStats {
  totalSize: string
  totalTables: number
  totalRows: number
  activeConnections: number
  cacheHitRate: number
  queryPerformance: {
    avgResponseTime: number
    slowQueries: number
  }
}

export default function DatabaseManagementPage() {
  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [synchronizing, setSynchronizing] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [progress, setProgress] = useState(0)
  
  const { success, error, warning, info } = useToastShortcuts()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportResponse, statusResponse, backupsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/database/integrity-report'),
        fetch('/api/admin/database/connection-status'),
        fetch('/api/admin/database/backups'),
        fetch('/api/admin/database/stats')
      ])

      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData.data)
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setConnectionStatus(statusData.data)
      }

      if (backupsResponse.ok) {
        const backupsData = await backupsResponse.json()
        setBackups(backupsData.data || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      error('Erreur de chargement', 'Impossible de charger les données de la base de données')
    } finally {
      setLoading(false)
    }
  }

  const handleSynchronize = async () => {
    setSynchronizing(true)
    setProgress(0)
    
    try {
      const response = await fetch('/api/admin/database/synchronize', {
        method: 'POST'
      })

      const result = await response.json()
      
      // L'API retourne { data: { success, message, details } }
      const apiResult = result.data || result
      
      if (apiResult.success) {
        success('Synchronisation réussie', apiResult.message)
        setProgress(100)
        setTimeout(() => loadData(), 2000)
      } else {
        const errorMessage = apiResult.details 
          ? `${apiResult.message}: ${apiResult.details}`
          : apiResult.message
        error('Erreur de synchronisation', errorMessage)
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation:', err)
      error('Erreur de synchronisation', 'Impossible de synchroniser la base de données')
    } finally {
      setSynchronizing(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const handleRunMigrations = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/database/run-migrations', {
        method: 'POST'
      })

      const result = await response.json()
      
      // L'API retourne { data: { success, message, details } }
      const apiResult = result.data || result
      
      if (apiResult.success) {
        success('Migrations exécutées', apiResult.message)
        setTimeout(() => loadData(), 2000)
      } else {
        const errorMessage = apiResult.details 
          ? `${apiResult.message}: ${apiResult.details}`
          : apiResult.message
        error('Erreur de migration', errorMessage)
      }
    } catch (err) {
      console.error('Erreur lors des migrations:', err)
      error('Erreur de migration', 'Impossible d\'exécuter les migrations')
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setBackingUp(true)
    setProgress(0)
    
    try {
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'manual',
          compress: true,
          includeMedia: false
        })
      })

      clearInterval(progressInterval)
      
      if (response.ok) {
        const result = await response.json()
        setProgress(100)
        success('Sauvegarde créée', 'La sauvegarde a été créée avec succès')
        
        // Télécharger le fichier de sauvegarde
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank')
        }
        
        setTimeout(() => loadData(), 2000)
      } else {
        error('Erreur de sauvegarde', 'Impossible de créer la sauvegarde')
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      error('Erreur de sauvegarde', 'Impossible de créer la sauvegarde')
    } finally {
      setBackingUp(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const handleRestore = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action écrasera toutes les données actuelles.')) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/admin/database/restore/${backupId}`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        success('Restauration réussie', 'La base de données a été restaurée avec succès')
        setTimeout(() => loadData(), 2000)
      } else {
        error('Erreur de restauration', result.message)
      }
    } catch (err) {
      console.error('Erreur lors de la restauration:', err)
      error('Erreur de restauration', 'Impossible de restaurer la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/database/backups/${backupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Sauvegarde supprimée', 'La sauvegarde a été supprimée avec succès')
        loadData()
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      error('Erreur de suppression', 'Impossible de supprimer la sauvegarde')
    }
  }

  const handleOptimize = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/database/optimize', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        success('Optimisation réussie', 'La base de données a été optimisée avec succès')
        loadData()
      } else {
        error('Erreur d\'optimisation', result.message)
      }
    } catch (err) {
      console.error('Erreur lors de l\'optimisation:', err)
      error('Erreur d\'optimisation', 'Impossible d\'optimiser la base de données')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ok': return 'success'
      case 'missing': return 'destructive'
      case 'extra': return 'warning'
      case 'error': return 'destructive'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-4 h-4" />
      case 'missing': return <XCircle className="w-4 h-4" />
      case 'extra': return <AlertCircle className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'OK'
      case 'missing': return 'Manquante'
      case 'extra': return 'Supplémentaire'
      case 'error': return 'Erreur'
      default: return status
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading && !report) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Chargement des données...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Gestion de la Base de Données</h1>
            <p className="text-muted-foreground mt-1">
              Contrôle, maintenance et sauvegarde de la base de données
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleOptimize} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Optimiser
          </Button>
          <Button onClick={loadData} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {progress > 0 && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {synchronizing && 'Synchronisation en cours...'}
            {backingUp && 'Sauvegarde en cours...'}
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-md"
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger 
            value="integrity" 
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-md"
          >
            Intégrité
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-md"
          >
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger 
            value="maintenance" 
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-md"
          >
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statut de connexion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>État du Système</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Connexion</h3>
                  {connectionStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">État</span>
                        <Badge variant={connectionStatus.connected ? 'success' : 'destructive'}>
                          {connectionStatus.connected ? 'Connecté' : 'Déconnecté'}
                        </Badge>
                      </div>
                      {connectionStatus.host && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Serveur</span>
                          <span className="text-sm font-mono">{connectionStatus.host}:{connectionStatus.port}</span>
                        </div>
                      )}
                      {connectionStatus.database && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Base de données</span>
                          <span className="text-sm font-mono">{connectionStatus.database}</span>
                        </div>
                      )}
                      {connectionStatus.version && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Version</span>
                          <span className="text-sm text-muted-foreground">{connectionStatus.version}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Statistiques</h3>
                  {stats ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taille totale</span>
                        <span className="text-sm font-semibold">{stats.totalSize}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tables</span>
                        <span className="text-sm font-semibold">{stats.totalTables}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Connexions actives</span>
                        <span className="text-sm font-semibold">{stats.activeConnections}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Performance cache</span>
                        <span className="text-sm font-semibold">{stats.cacheHitRate}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taille totale</span>
                        <span className="text-sm font-semibold">125 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tables</span>
                        <span className="text-sm font-semibold">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Connexions actives</span>
                        <span className="text-sm font-semibold">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Performance cache</span>
                        <span className="text-sm font-semibold">98%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-200 relative ${
                activeTab === 'integrity' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-lg hover:bg-muted/20'
              }`} 
              onClick={() => setActiveTab('integrity')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Intégrité
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report ? `${report.summary.ok}/${report.summary.total}` : '0/0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tables conformes
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 relative ${
                activeTab === 'backup' 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : 'hover:shadow-lg hover:bg-muted/20'
              }`} 
              onClick={() => setActiveTab('backup')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sauvegardes
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backups.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sauvegardes disponibles
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 relative ${
                activeTab === 'maintenance' 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:shadow-lg hover:bg-muted/20'
              }`} 
              onClick={() => setActiveTab('maintenance')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Maintenance
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Settings className="h-8 w-8" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Optimiser maintenant
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          {/* Résumé du rapport */}
          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Résumé de l'Intégrité</CardTitle>
                  <CardDescription>
                    État actuel de la base de données vs configuration attendue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{report.summary.ok}</div>
                      <div className="text-sm text-muted-foreground">Tables OK</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">{report.summary.missing}</div>
                      <div className="text-sm text-muted-foreground">Manquantes</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">{report.summary.extra}</div>
                      <div className="text-sm text-muted-foreground">Supplémentaires</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{report.summary.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {report.canSynchronize && (
                      <Button 
                        onClick={handleSynchronize} 
                        disabled={synchronizing}
                        className="w-full"
                        variant="default"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                        {synchronizing ? 'Synchronisation...' : 'Synchroniser la Base de Données'}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleRunMigrations} 
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Exécuter les Migrations
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Détails des tables */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails des Tables</CardTitle>
                  <CardDescription>
                    État détaillé de chaque table de la base de données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.tableDetails.map((table, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(table.status)}
                          <div>
                            <code className="text-sm font-medium">{table.name}</code>
                            {table.columns && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {table.columns.length} colonnes
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {table.rowCount !== undefined && (
                            <span className="text-sm text-muted-foreground">
                              {table.rowCount.toLocaleString()} lignes
                            </span>
                          )}
                          {table.size && (
                            <span className="text-sm text-muted-foreground">
                              {table.size}
                            </span>
                          )}
                          <Badge variant={getStatusBadgeVariant(table.status) as any}>
                            {getStatusText(table.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sauvegardes</CardTitle>
                  <CardDescription>
                    Gérez les sauvegardes de votre base de données
                  </CardDescription>
                </div>
                <Button onClick={handleBackup} disabled={backingUp}>
                  <Download className="w-4 h-4 mr-2" />
                  {backingUp ? 'Sauvegarde...' : 'Nouvelle sauvegarde'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {backups.length > 0 ? (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                          <HardDrive className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{backup.filename}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(backup.createdAt).toLocaleString()}
                            </span>
                            <span>{backup.size}</span>
                            <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                              {backup.type === 'manual' ? 'Manuel' : 'Planifié'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => window.open(`/api/admin/database/backups/${backup.id}/download`, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleRestore(backup.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteBackup(backup.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune sauvegarde disponible</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Créez votre première sauvegarde pour protéger vos données
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Planification des sauvegardes */}
          <Card>
            <CardHeader>
              <CardTitle>Planification des sauvegardes</CardTitle>
              <CardDescription>
                Configurez des sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde quotidienne</p>
                    <p className="text-sm text-muted-foreground">Tous les jours à 02:00</p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde hebdomadaire</p>
                    <p className="text-sm text-muted-foreground">Tous les dimanches à 03:00</p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outils de Maintenance</CardTitle>
              <CardDescription>
                Optimisez et maintenez votre base de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={handleOptimize}
                  disabled={loading}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <Settings className="w-5 h-5 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium">Optimiser les tables</p>
                      <p className="text-sm text-muted-foreground">
                        Réorganise les données pour améliorer les performances
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {}}
                  disabled={loading}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <Activity className="w-5 h-5 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium">Analyser les performances</p>
                      <p className="text-sm text-muted-foreground">
                        Identifie les requêtes lentes et les optimisations possibles
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {}}
                  disabled={loading}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <History className="w-5 h-5 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium">Nettoyer les logs</p>
                      <p className="text-sm text-muted-foreground">
                        Supprime les anciens logs et libère de l'espace
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {}}
                  disabled={loading}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium">Vérifier la sécurité</p>
                      <p className="text-sm text-muted-foreground">
                        Analyse les vulnérabilités et les permissions
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historique de maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Historique de maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Optimisation des tables</span>
                  </div>
                  <span className="text-muted-foreground">Il y a 2 jours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span>Nettoyage des logs</span>
                  </div>
                  <span className="text-muted-foreground">Il y a 1 semaine</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Vérification de sécurité</span>
                  </div>
                  <span className="text-muted-foreground">Il y a 2 semaines</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}