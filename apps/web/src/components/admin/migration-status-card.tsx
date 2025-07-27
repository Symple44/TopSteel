'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import { Button } from '@erp/ui'
import { Badge } from '@erp/ui'
import { Progress } from '@erp/ui'
import { 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Database,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'

interface MigrationFile {
  name: string
  status: 'executed' | 'pending' | 'error'
  executedAt?: string
  error?: string
}

interface MigrationStatusCardProps {
  database: string
  status: 'up-to-date' | 'pending' | 'error'
  executed: string[]
  pending: string[]
  error?: string
  onRunMigrations?: () => void
  variant?: 'auth' | 'shared' | 'tenant'
  isLoading?: boolean
}

export default function MigrationStatusCard({
  database,
  status,
  executed,
  pending,
  error,
  onRunMigrations,
  variant = 'tenant',
  isLoading = false
}: MigrationStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const getStatusIcon = () => {
    switch (status) {
      case 'up-to-date': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'up-to-date': return 'success'
      case 'pending': return 'warning'
      case 'error': return 'destructive'
    }
  }

  const getVariantColor = () => {
    switch (variant) {
      case 'auth': return 'border-l-blue-500'
      case 'shared': return 'border-l-purple-500'
      case 'tenant': return 'border-l-orange-500'
    }
  }

  const getVariantIcon = () => {
    switch (variant) {
      case 'auth': return <Database className="w-4 h-4 text-blue-600" />
      case 'shared': return <Database className="w-4 h-4 text-purple-600" />
      case 'tenant': return <Database className="w-4 h-4 text-orange-600" />
    }
  }

  const totalMigrations = executed.length + pending.length
  const progressPercentage = totalMigrations > 0 ? (executed.length / totalMigrations) * 100 : 100

  const formatMigrationName = (migrationName: string) => {
    // Extraire le nom plus lisible de la migration
    const cleanName = migrationName
      .replace(/^\d{3}-/, '') // Enlever le préfixe numérique
      .replace(/\.ts$/, '') // Enlever l'extension
      .replace(/([A-Z])/g, ' $1') // Ajouter des espaces avant les majuscules
      .replace(/^./, str => str.toUpperCase()) // Capitaliser la première lettre
    
    return cleanName
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('Create')) return <Layers className="w-3 h-3" />
    if (fileName.includes('Update') || fileName.includes('Alter')) return <FileText className="w-3 h-3" />
    return <FileText className="w-3 h-3" />
  }

  return (
    <Card className={`border-l-4 ${getVariantColor()} hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getVariantIcon()}
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                {database}
              </CardTitle>
              <CardDescription className="text-xs">
                Base de données {variant}
              </CardDescription>
            </div>
            {getStatusIcon()}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusBadgeVariant() as any} className="text-xs">
              {status === 'up-to-date' && 'À jour'}
              {status === 'pending' && 'En attente'}
              {status === 'error' && 'Erreur'}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Résumé rapide */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{executed.length}</div>
            <div className="text-xs text-muted-foreground">Exécutées</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{pending.length}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{totalMigrations}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progression</span>
            <span className="font-mono">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            <Info className="w-3 h-3 mr-1" />
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
          
          {pending.length > 0 && (
            <Button
              size="sm"
              onClick={onRunMigrations}
              disabled={isLoading}
              className="text-xs"
            >
              <PlayCircle className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Exécuter ({pending.length})
            </Button>
          )}
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Erreur de migration</p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1 break-words">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Détails étendus */}
        {(isExpanded || showDetails) && (
          <div className="space-y-4 border-t pt-4">
            {/* Migrations en attente */}
            {pending.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  Migrations en attente ({pending.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pending.map((migration, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                      {getFileIcon(migration)}
                      <span className="font-mono text-yellow-800 dark:text-yellow-200 truncate">
                        {formatMigrationName(migration)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Migrations exécutées (dernières) */}
            {executed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  Dernières migrations ({Math.min(executed.length, 5)}/{executed.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {executed.slice(-5).map((migration, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      {getFileIcon(migration)}
                      <span className="font-mono text-green-800 dark:text-green-200 truncate">
                        {formatMigrationName(migration)}
                      </span>
                      <Clock className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {totalMigrations === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Aucune migration trouvée</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}