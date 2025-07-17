'use client'

import { useState, useEffect } from 'react'
import { Button } from '@erp/ui'
import { Alert, AlertDescription } from '@erp/ui'
import { Badge } from '@erp/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'

interface TableInfo {
  name: string
  expected: boolean
  exists: boolean
  columns?: string[]
  status: 'ok' | 'missing' | 'extra' | 'error'
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
}

export default function DatabaseManagementPage() {
  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [synchronizing, setSynchronizing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportResponse, statusResponse] = await Promise.all([
        fetch('/api/admin/database/integrity-report'),
        fetch('/api/admin/database/connection-status')
      ])

      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData.data)
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setConnectionStatus(statusData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const handleSynchronize = async () => {
    setSynchronizing(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/database/synchronize', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        // Recharger le rapport après synchronisation
        setTimeout(() => loadData(), 1000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la synchronisation' })
    } finally {
      setSynchronizing(false)
    }
  }

  const handleRunMigrations = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/database/run-migrations', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setTimeout(() => loadData(), 1000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      console.error('Erreur lors des migrations:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'exécution des migrations' })
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'OK'
      case 'missing': return 'Manquante'
      case 'extra': return 'Supplémentaire'
      case 'error': return 'Erreur'
      default: return status
    }
  }

  if (loading && !report) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Chargement du rapport d'intégrité...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Base de Données</h1>
          <p className="text-muted-foreground mt-2">
            Contrôle d'intégrité et synchronisation de la base de données
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={loadData} disabled={loading}>
            {loading ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Statut de connexion */}
      <Card>
        <CardHeader>
          <CardTitle>Statut de la Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant={connectionStatus.connected ? 'success' : 'destructive'}>
                  {connectionStatus.connected ? 'Connecté' : 'Déconnecté'}
                </Badge>
                {connectionStatus.version && (
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus.version}
                  </span>
                )}
              </div>
              {connectionStatus.error && (
                <p className="text-sm text-red-600">{connectionStatus.error}</p>
              )}
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </CardContent>
      </Card>

      {/* Résumé du rapport */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé de l'Intégrité</CardTitle>
            <CardDescription>
              État actuel de la base de données vs configuration attendue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.summary.ok}</div>
                <div className="text-sm text-muted-foreground">Tables OK</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{report.summary.missing}</div>
                <div className="text-sm text-muted-foreground">Manquantes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.extra}</div>
                <div className="text-sm text-muted-foreground">Supplémentaires</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{report.summary.total}</div>
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
                  {synchronizing ? 'Synchronisation...' : 'Synchroniser la Base de Données'}
                </Button>
              )}
              
              <Button 
                onClick={handleRunMigrations} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Exécuter les Migrations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détails des tables */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Détails des Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.tableDetails.map((table, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{table.name}</code>
                    <Badge variant={getStatusBadgeVariant(table.status) as any}>
                      {getStatusText(table.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {table.columns && (
                      <span>{table.columns.length} colonnes</span>
                    )}
                    {!table.expected && <span className="ml-2">(Non attendue)</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}