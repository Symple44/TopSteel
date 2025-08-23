'use client'
import { useEffect, useState } from 'react'
import { FileText, Loader, BarChart3, Download, CheckCircle, Calendar, Database, TrendingUp } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type ReportType = 'financial' | 'production' | 'inventory' | 'quality' | 'sales' | 'compliance'
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html'
export interface ReportProgress {
  currentStep: string
  percentage: number
  estimatedTimeRemaining: number // in seconds
  recordsProcessed: number
  totalRecords: number
}
export interface ReportLoadingProps {
  className?: string
  reportType: ReportType
  reportName: string
  format: ReportFormat
  isGenerating: boolean
  progress?: ReportProgress
  onCancel?: () => void
  onDownload?: (reportId: string) => void
  reportId?: string
  timeElapsed?: number // in seconds
  showProgress?: boolean
}
const reportTypeConfig = {
  financial: {
    icon: TrendingUp,
    label: 'Rapport financier',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  production: {
    icon: BarChart3,
    label: 'Rapport de production',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  inventory: {
    icon: Database,
    label: 'Rapport d\'inventaire',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  quality: {
    icon: CheckCircle,
    label: 'Rapport qualité',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  sales: {
    icon: TrendingUp,
    label: 'Rapport des ventes',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  compliance: {
    icon: FileText,
    label: 'Rapport de conformité',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}
const formatConfig = {
  pdf: { label: 'PDF', icon: FileText },
  excel: { label: 'Excel', icon: FileText },
  csv: { label: 'CSV', icon: FileText },
  html: { label: 'HTML', icon: FileText }
}
export function ReportLoading({
  className,
  reportType,
  reportName,
  format,
  isGenerating,
  progress,
  onCancel,
  onDownload,
  reportId,
  timeElapsed,
  showProgress = true
}: ReportLoadingProps) {
  const [dots, setDots] = useState('')
  const config = reportTypeConfig[reportType]
  const formatInfo = formatConfig[format]
  const IconComponent = config.icon
  // Animate loading dots
  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)
    return () => clearInterval(interval)
  }, [isGenerating])
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}min ${Math.round(seconds % 60)}s`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}min`
  }
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }
  const getProgressColor = () => {
    if (!progress) return 'bg-blue-500'
    if (progress.percentage < 30) return 'bg-red-500'
    if (progress.percentage < 70) return 'bg-orange-500'
    return 'bg-green-500'
  }
  return (
    <div className={cn(
      'rounded-lg border p-6',
      isGenerating ? config.bgColor : 'bg-green-50',
      isGenerating ? config.borderColor : 'border-green-200',
      className
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {isGenerating ? (
              <Loader className={cn('h-6 w-6 animate-spin', config.color)} />
            ) : reportId ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <IconComponent className={cn('h-6 w-6', config.color)} />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {isGenerating ? `Génération en cours${dots}` : reportId ? 'Rapport généré' : 'Préparation du rapport'}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {reportName} ({formatInfo.label})
          </p>
        </div>
        {/* Report Info */}
        <div className="bg-white/50 rounded-lg p-4 border border-white/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium">{config.label}</span>
            </div>
            <div>
              <span className="text-gray-500">Format:</span>
              <span className="ml-2 font-medium">{formatInfo.label}</span>
            </div>
            <div>
              <span className="text-gray-500">Demande:</span>
              <span className="ml-2">{new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            {timeElapsed && (
              <div>
                <span className="text-gray-500">Durée:</span>
                <span className="ml-2">{formatTime(timeElapsed)}</span>
              </div>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        {showProgress && progress && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-medium">{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-3">
              <div
                className={cn('h-3 rounded-full transition-all duration-300', getProgressColor())}
                style={{ width: `${progress.percentage}%` }}
              >
                <div className="h-full bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>
            {/* Current Step */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{progress.currentStep}</p>
              {progress.totalRecords > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {formatNumber(progress.recordsProcessed)} / {formatNumber(progress.totalRecords)} enregistrements traités
                </p>
              )}
            </div>
            {/* Time Remaining */}
            {progress.estimatedTimeRemaining > 0 && isGenerating && (
              <div className="text-center">
                <p className="text-xs text-gray-600">
                  Temps restant estimé: {formatTime(progress.estimatedTimeRemaining)}
                </p>
              </div>
            )}
          </div>
        )}
        {/* Processing Steps for Complex Reports */}
        {isGenerating && reportType === 'financial' && (
          <div className="bg-white/50 rounded-lg p-4 border border-white/20">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Étapes de génération</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Collecte des données comptables</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Calcul des indicateurs financiers</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-gray-700">Génération des graphiques</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Mise en forme du document</span>
              </div>
            </div>
          </div>
        )}
        {/* Completion Message */}
        {reportId && !isGenerating && (
          <div className="bg-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Rapport généré avec succès!
              </span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Votre rapport est prêt et disponible pour téléchargement.
            </p>
            {onDownload && (
              <button
                onClick={() => onDownload(reportId)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Télécharger le rapport
              </button>
            )}
          </div>
        )}
        {/* Cancel Button */}
        {isGenerating && onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              Annuler la génération
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
