'use client'
import { AlertTriangle, Factory, Package, Scale, Thermometer, TrendingDown } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type QualitySeverity = 'low' | 'medium' | 'high' | 'critical'
export type QualityIssueType =
  | 'dimensional'
  | 'material_defect'
  | 'surface_finish'
  | 'chemical_composition'
  | 'mechanical_properties'
  | 'weight_variance'
export interface QualityIssue {
  id: string
  type: QualityIssueType
  title: string
  description: string
  severity: QualitySeverity
  affectedLots: string[]
  affectedQuantity: number
  detectedAt: string
  inspector: string
  corrective_actions: string[]
  estimated_cost: number
  delivery_impact: boolean
}
export interface QualityAlertProps {
  className?: string
  issues: QualityIssue[]
  onResolveIssue?: (issueId: string) => void
  onViewDetails?: (issueId: string) => void
  onEscalate?: (issueId: string) => void
  showActions?: boolean
}
const severityConfig = {
  low: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    title: 'Problèmes de qualité mineurs',
  },
  medium: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    title: 'Problèmes de qualité modérés',
  },
  high: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    title: 'Problèmes de qualité importants',
  },
  critical: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
    title: 'Problèmes de qualité critiques',
  },
}
const typeConfig = {
  dimensional: {
    icon: Scale,
    label: 'Dimensions',
    color: 'text-blue-600',
  },
  material_defect: {
    icon: AlertTriangle,
    label: 'Défaut matériau',
    color: 'text-red-600',
  },
  surface_finish: {
    icon: Package,
    label: 'Finition surface',
    color: 'text-purple-600',
  },
  chemical_composition: {
    icon: Thermometer,
    label: 'Composition chimique',
    color: 'text-green-600',
  },
  mechanical_properties: {
    icon: Factory,
    label: 'Propriétés mécaniques',
    color: 'text-orange-600',
  },
  weight_variance: {
    icon: Scale,
    label: 'Variance de poids',
    color: 'text-indigo-600',
  },
}
export function QualityAlert({
  className,
  issues,
  onResolveIssue,
  onViewDetails,
  onEscalate,
  showActions = true,
}: QualityAlertProps) {
  const highestSeverity = issues.reduce((max, issue) => {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
    return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max
  }, 'low' as QualitySeverity)
  const config = severityConfig[highestSeverity]
  const totalAffectedQuantity = issues.reduce((sum, issue) => sum + issue.affectedQuantity, 0)
  const totalEstimatedCost = issues.reduce((sum, issue) => sum + issue.estimated_cost, 0)
  const deliveryImpactCount = issues.filter((issue) => issue.delivery_impact).length
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const getSeverityBadge = (severity: QualitySeverity) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
    }
    const labels = {
      low: 'Mineur',
      medium: 'Modéré',
      high: 'Important',
      critical: 'Critique',
    }
    return { color: colors[severity], label: labels[severity] }
  }
  return (
    <div className={cn('rounded-lg border p-4', config.bgColor, config.borderColor, className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
        <div className="flex-1 space-y-4">
          <div>
            <h3 className={cn('font-medium', config.textColor)}>{config.title}</h3>
            <p className={cn('text-sm mt-1', config.textColor)}>
              {issues.length} problème{issues.length > 1 ? 's' : ''} détecté
              {issues.length > 1 ? 's' : ''} •{totalAffectedQuantity} unités affectées • Impact
              estimé: {formatCurrency(totalEstimatedCost)}
            </p>
          </div>
          {/* Summary Stats */}
          {deliveryImpactCount > 0 && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {deliveryImpactCount} problème{deliveryImpactCount > 1 ? 's' : ''} impact
                  {deliveryImpactCount === 1 ? 'e' : 'ent'} les livraisons
                </span>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {issues.map((issue) => {
              const TypeIcon = typeConfig[issue.type].icon
              const severityBadge = getSeverityBadge(issue.severity)
              return (
                <div key={issue.id} className="bg-white/50 rounded-lg p-4 border border-white/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <TypeIcon className={cn('h-5 w-5 mt-0.5', typeConfig[issue.type].color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded-full font-medium',
                              severityBadge.color
                            )}
                          >
                            {severityBadge.label}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded-full bg-gray-100',
                              typeConfig[issue.type].color
                            )}
                          >
                            {typeConfig[issue.type].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Lots affectés:</span>
                            <span className="ml-2 font-medium">
                              {issue.affectedLots.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantité:</span>
                            <span className="ml-2 font-medium">
                              {issue.affectedQuantity} unités
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Détecté le:</span>
                            <span className="ml-2">{formatDate(issue.detectedAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Inspecteur:</span>
                            <span className="ml-2">{issue.inspector}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Coût estimé:</span>
                            <span className="ml-2 font-medium">
                              {formatCurrency(issue.estimated_cost)}
                            </span>
                          </div>
                          {issue.delivery_impact && (
                            <div>
                              <span className="text-red-600 font-medium">Impact livraison:</span>
                              <span className="ml-2 text-red-600">Oui</span>
                            </div>
                          )}
                        </div>
                        {issue.corrective_actions.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <h5 className="text-sm font-medium text-blue-800 mb-2">
                              Actions correctives recommandées:
                            </h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {issue.corrective_actions.map((action, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    {showActions && (
                      <div className="flex flex-col gap-1">
                        {onResolveIssue && (
                          <button
                            onClick={() => onResolveIssue(issue.id)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Résoudre
                          </button>
                        )}
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(issue.id)}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Détails
                          </button>
                        )}
                        {onEscalate && issue.severity !== 'critical' && (
                          <button
                            onClick={() => onEscalate(issue.id)}
                            className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            Escalader
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
