'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Button } from '@erp/ui'
import { Badge } from '@erp/ui'
import { 
  Search, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  Loader2
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

interface ElasticsearchStatus {
  connected: boolean
  indices: Record<string, {
    exists: boolean
    documentCount?: number
    status: 'healthy' | 'error'
    error?: string
  }>
}

export function ElasticsearchAdmin() {
  const { t } = useTranslation('admin')
  const [status, setStatus] = useState<ElasticsearchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/elasticsearch?action=status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch Elasticsearch status:', error)
      toast.error('Erreur lors de la récupération du statut Elasticsearch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const runMigrations = async () => {
    setOperationLoading('migrate')
    try {
      const response = await fetch('/api/admin/elasticsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Migrations Elasticsearch terminées avec succès')
        await fetchStatus()
      } else {
        toast.error('Certaines migrations ont échoué')
      }
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Erreur lors des migrations')
    } finally {
      setOperationLoading(null)
    }
  }

  const resetIndex = async (indexName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir réinitialiser l'index ${indexName} ? Toutes les données seront perdues.`)) {
      return
    }

    setOperationLoading(`reset-${indexName}`)
    try {
      const response = await fetch('/api/admin/elasticsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', indexName })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Index ${indexName} réinitialisé avec succès`)
        await fetchStatus()
      } else {
        toast.error(`Erreur lors de la réinitialisation de l'index ${indexName}`)
      }
    } catch (error) {
      console.error('Reset failed:', error)
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setOperationLoading(null)
    }
  }

  const getStatusBadge = (connected: boolean) => {
    if (connected) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connecté
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Déconnecté
        </Badge>
      )
    }
  }

  const getIndexStatusBadge = (index: any) => {
    if (!index.exists) {
      return (
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Non créé
        </Badge>
      )
    }

    if (index.status === 'healthy') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actif ({index.documentCount} docs)
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Erreur
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement du statut Elasticsearch...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statut de connexion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Elasticsearch - Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-medium">Statut de connexion</p>
                <p className="text-sm text-muted-foreground">
                  {process.env.NEXT_PUBLIC_ELASTICSEARCH_URL || 'http://localhost:9200 (par défaut)'}
                </p>
              </div>
              {status && getStatusBadge(status.connected)}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              
              {status?.connected && (
                <Button 
                  onClick={runMigrations}
                  disabled={operationLoading === 'migrate'}
                >
                  {operationLoading === 'migrate' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Lancer les migrations
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
              Index Elasticsearch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(status.indices).map(([indexName, indexInfo]) => (
                <div key={indexName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{indexName}</p>
                      <p className="text-sm text-muted-foreground">
                        {indexInfo.error || 'Index pour la recherche d\'images'}
                      </p>
                    </div>
                    {getIndexStatusBadge(indexInfo)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
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
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Variables d'environnement</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li><code>ELASTICSEARCH_URL</code>: URL du serveur Elasticsearch</li>
                <li><code>ELASTICSEARCH_USERNAME</code>: Nom d'utilisateur (optionnel)</li>
                <li><code>ELASTICSEARCH_PASSWORD</code>: Mot de passe (optionnel)</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium">Fonctionnalités</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Recherche d'images par nom, tags, description</li>
                <li>• Autocomplétion et suggestions</li>
                <li>• Filtres par catégorie, taille, date</li>
                <li>• Indexation automatique lors de l'upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}