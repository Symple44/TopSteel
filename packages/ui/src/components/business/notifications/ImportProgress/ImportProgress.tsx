'use client'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Clock, Package } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type ImportStatus = 'pending' | 'uploading' | 'processing' | 'validating' | 'importing' | 'completed' | 'failed' | 'cancelled'
export interface ImportError {
  row: number
  column?: string
  message: string
  severity: 'error' | 'warning'
}
export interface ImportFileDetails {
  name: string
  size: number
  type: string
  lastModified: number
}
export interface ImportStats {
  totalRows: number
  processedRows: number
  successfulRows: number
  skippedRows: number
  errorRows: number
  validationWarnings: number
}
export interface ImportProgressProps {
  className?: string
  status: ImportStatus
  file?: ImportFileDetails
  progress: number // 0-100
  currentStep?: string
  timeElapsed?: number // in seconds
  timeRemaining?: number // in seconds
  stats?: ImportStats
  errors?: ImportError[]
  onCancel?: () => void
  onRetry?: () => void
  onDownloadErrorReport?: () => void
  showDetailedStats?: boolean
}
const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'En attente'
  },
  uploading: {
    icon: Upload,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Téléchargement'
  },
  processing: {
    icon: Package,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Traitement'
  },
  validating: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Validation'
  },
  importing: {
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    title: 'Import'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Terminé'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Échec'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Annulé'
  }
}
export function ImportProgress({
  className,
  status,
  file,
  progress,
  currentStep,
  timeElapsed,
  timeRemaining,
  stats,
  errors = [],
  onCancel,
  onRetry,
  onDownloadErrorReport,
  showDetailedStats = true
}: ImportProgressProps) {
  const config = statusConfig[status]
  const IconComponent = config.icon
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}min`
  }
  const getProgressBarColor = () => {
    if (status === 'failed') return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    if (status === 'cancelled') return 'bg-gray-400'
    return 'bg-blue-500'
  }
  const isInProgress = ['uploading', 'processing', 'validating', 'importing'].includes(status)
  const isCompleted = status === 'completed'
  const hasFailed = status === 'failed'
  const isCancelled = status === 'cancelled'
  return (
    <div className={cn(
      'rounded-lg border p-6',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className={cn('h-6 w-6', config.color)} />
            <div>
              <h3 className="font-medium text-gray-900">{config.title}</h3>
              {currentStep && (
                <p className="text-sm text-gray-600">{currentStep}</p>
              )}
            </div>
          </div>
          {isInProgress && onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border rounded"
            >
              Annuler
            </button>
          )}
          {hasFailed && onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-100 rounded"
            >
              Réessayer
            </button>
          )}
        </div>
        {/* File Info */}
        {file && (
          <div className="bg-white/50 rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Taille:</span>
                <span className="ml-1">{formatFileSize(file.size)}</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-1">{file.type}</span>
              </div>
              <div>
                <span className="font-medium">Modifié:</span>
                <span className="ml-1">{new Date(file.lastModified).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        )}
        {/* Progress Bar */}
        {(isInProgress || isCompleted || hasFailed) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-300', getProgressBarColor())}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {/* Time Info */}
        {(timeElapsed || timeRemaining) && (
          <div className="flex justify-between text-sm text-gray-600">
            {timeElapsed && (
              <span>Temps écoulé: {formatTime(timeElapsed)}</span>
            )}
            {timeRemaining && isInProgress && (
              <span>Temps restant: {formatTime(timeRemaining)}</span>
            )}
          </div>
        )}
        {/* Stats */}
        {stats && showDetailedStats && (
          <div className="bg-white/50 rounded-lg p-4 border border-white/20">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistiques d'import</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{stats.totalRows}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.successfulRows}</div>
                <div className="text-gray-600">Succès</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.errorRows}</div>
                <div className="text-gray-600">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.skippedRows}</div>
                <div className="text-gray-600">Ignorées</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.validationWarnings}</div>
                <div className="text-gray-600">Avertissements</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.processedRows}</div>
                <div className="text-gray-600">Traitées</div>
              </div>
            </div>
          </div>
        )}
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-red-800">
                Erreurs ({errors.length})
              </h4>
              {onDownloadErrorReport && (
                <button
                  onClick={onDownloadErrorReport}
                  className="text-xs text-red-600 hover:text-red-700 underline"
                >
                  Télécharger le rapport
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {errors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-red-700">Ligne {error.row}:</span>
                  <span className="text-red-600 ml-2">{error.message}</span>
                  {error.column && (
                    <span className="text-red-500 ml-2">({error.column})</span>
                  )}
                </div>
              ))}
              {errors.length > 5 && (
                <p className="text-xs text-red-600">+{errors.length - 5} erreurs supplémentaires</p>
              )}
            </div>
          </div>
        )}
        {/* Success Message */}
        {isCompleted && stats && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Import terminé avec succès!
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {stats.successfulRows} lignes importées sur {stats.totalRows} au total
            </p>
          </div>
        )}
        {/* Failure Message */}
        {hasFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                L'import a échoué
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Veuillez vérifier les erreurs ci-dessus et réessayer
            </p>
          </div>
        )}
        {/* Cancelled Message */}
        {isCancelled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                Import annulé
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1">
              L'opération d'import a été annulée par l'utilisateur
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
