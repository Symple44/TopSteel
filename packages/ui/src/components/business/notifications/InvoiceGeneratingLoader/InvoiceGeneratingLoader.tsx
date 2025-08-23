'use client'
import { useEffect, useState } from 'react'
import { FileText, Loader, CheckCircle, Package, Calculator, Euro, Calendar } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type InvoiceGenerationStep = 
  | 'calculating_totals'
  | 'generating_line_items'
  | 'applying_taxes'
  | 'formatting_document'
  | 'generating_pdf'
  | 'saving_to_database'
  | 'completed'
export interface InvoiceData {
  invoiceNumber?: string
  customerName: string
  totalAmount?: number
  lineItemsCount?: number
  taxAmount?: number
  currency?: string
  dueDate?: string
}
export interface InvoiceGeneratingLoaderProps {
  className?: string
  isGenerating: boolean
  currentStep?: InvoiceGenerationStep
  progress?: number // 0-100
  invoiceData: InvoiceData
  estimatedTime?: number // in seconds
  timeElapsed?: number // in seconds
  onComplete?: (invoiceId: string) => void
  onError?: (error: string) => void
}
const steps = [
  {
    key: 'calculating_totals' as const,
    label: 'Calcul des montants',
    description: 'Calcul des totaux et sous-totaux',
    icon: Calculator,
    duration: 1000
  },
  {
    key: 'generating_line_items' as const,
    label: 'Génération des lignes',
    description: 'Création des lignes de facturation',
    icon: Package,
    duration: 2000
  },
  {
    key: 'applying_taxes' as const,
    label: 'Application des taxes',
    description: 'Calcul et application de la TVA',
    icon: Euro,
    duration: 500
  },
  {
    key: 'formatting_document' as const,
    label: 'Formatage du document',
    description: 'Mise en forme de la facture',
    icon: FileText,
    duration: 1500
  },
  {
    key: 'generating_pdf' as const,
    label: 'Génération PDF',
    description: 'Création du fichier PDF',
    icon: FileText,
    duration: 2000
  },
  {
    key: 'saving_to_database' as const,
    label: 'Sauvegarde',
    description: 'Enregistrement en base de données',
    icon: CheckCircle,
    duration: 800
  },
  {
    key: 'completed' as const,
    label: 'Terminé',
    description: 'Facture générée avec succès',
    icon: CheckCircle,
    duration: 0
  }
]
export function InvoiceGeneratingLoader({
  className,
  isGenerating,
  currentStep = 'calculating_totals',
  progress = 0,
  invoiceData,
  estimatedTime,
  timeElapsed,
  onComplete,
  onError
}: InvoiceGeneratingLoaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [dots, setDots] = useState('')
  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const currentStepConfig = steps[currentStepIndex] || steps[0]
  const IconComponent = currentStepConfig.icon
  // Animate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = progress - prev
        if (Math.abs(diff) < 0.1) return progress
        return prev + diff * 0.1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [progress])
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
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(amount)
  }
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    return `${Math.round(seconds / 60)}min ${Math.round(seconds % 60)}s`
  }
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex && isGenerating) return 'current'
    if (stepIndex === currentStepIndex && !isGenerating && currentStep === 'completed') return 'completed'
    return 'pending'
  }
  return (
    <div className={cn(
      'bg-blue-50 border border-blue-200 rounded-lg p-6',
      className
    )}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {isGenerating ? (
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            ) : currentStep === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <FileText className="h-6 w-6 text-blue-600" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {currentStep === 'completed' ? 'Facture générée' : `Génération de facture${dots}`}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {currentStepConfig.description}
          </p>
        </div>
        {/* Invoice Info */}
        <div className="bg-white/50 rounded-lg p-4 border border-white/20">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informations de facturation</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Client:</span>
              <span className="ml-2 font-medium">{invoiceData.customerName}</span>
            </div>
            {invoiceData.invoiceNumber && (
              <div>
                <span className="text-gray-500">N° Facture:</span>
                <span className="ml-2 font-medium">{invoiceData.invoiceNumber}</span>
              </div>
            )}
            {invoiceData.lineItemsCount && (
              <div>
                <span className="text-gray-500">Lignes:</span>
                <span className="ml-2 font-medium">{invoiceData.lineItemsCount}</span>
              </div>
            )}
            {invoiceData.totalAmount && (
              <div>
                <span className="text-gray-500">Montant total:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(invoiceData.totalAmount, invoiceData.currency)}
                </span>
              </div>
            )}
            {invoiceData.taxAmount && (
              <div>
                <span className="text-gray-500">TVA:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(invoiceData.taxAmount, invoiceData.currency)}
                </span>
              </div>
            )}
            {invoiceData.dueDate && (
              <div>
                <span className="text-gray-500">Échéance:</span>
                <span className="ml-2 font-medium">
                  {new Date(invoiceData.dueDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium">{Math.round(animatedProgress)}%</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3">
            <div
              className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${animatedProgress}%` }}
            >
              <div className="h-full bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        {/* Time Info */}
        {(timeElapsed || estimatedTime) && (
          <div className="flex justify-between text-sm text-gray-600">
            {timeElapsed && (
              <span>Temps écoulé: {formatTime(timeElapsed)}</span>
            )}
            {estimatedTime && isGenerating && (
              <span>Temps estimé: {formatTime(estimatedTime)}</span>
            )}
          </div>
        )}
        {/* Steps */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Étapes de génération</h4>
          <div className="space-y-2">
            {steps.slice(0, -1).map((step, index) => {
              const status = getStepStatus(index)
              const StepIcon = step.icon
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                    status === 'completed' ? 'bg-green-100' :
                    status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : status === 'current' ? (
                      <StepIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <StepIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      'text-sm font-medium',
                      status === 'completed' ? 'text-green-700' :
                      status === 'current' ? 'text-blue-700' : 'text-gray-500'
                    )}>
                      {step.label}
                      {status === 'current' && isGenerating && (
                        <span className="ml-2 text-blue-500">{dots}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Completion Message */}
        {currentStep === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Facture générée avec succès!
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              La facture est maintenant disponible pour téléchargement et envoi.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
