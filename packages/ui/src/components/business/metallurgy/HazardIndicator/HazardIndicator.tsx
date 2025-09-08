'use client'
import { AlertTriangle, Eye, Flame, ShieldAlert, Skull, Thermometer, Wind, Zap } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { HazardLevel } from '../../../../types/variants'
import { getMaxHazardLevel } from '../../../../types/variants'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'

// Define the full Hazard type for this component
interface ExtendedHazard {
  id: string
  name: string
  severity: HazardLevel
  description?: string
  icon?: string
  color?: string
  type:
    | 'fire'
    | 'toxic'
    | 'corrosive'
    | 'explosive'
    | 'electrical'
    | 'radiation'
    | 'biological'
    | 'environmental'
  title: string
  precautions: string[]
  exposure?: {
    timeLimit?: string
    concentration?: string
    temperature?: string
  }
}
interface HazardIndicatorProps {
  className?: string
  hazards: ExtendedHazard[]
  materialName?: string
  compact?: boolean
  showPrecautions?: boolean
  onHazardClick?: (hazard: ExtendedHazard) => void
}
export function HazardIndicator({
  className,
  hazards,
  materialName,
  compact = false,
  showPrecautions = true,
  onHazardClick,
}: HazardIndicatorProps) {
  const getHazardIcon = (type: ExtendedHazard['type']) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-5 h-5" />
      case 'toxic':
        return <Skull className="w-5 h-5" />
      case 'corrosive':
        return <Eye className="w-5 h-5" />
      case 'explosive':
        return <AlertTriangle className="w-5 h-5" />
      case 'electrical':
        return <Zap className="w-5 h-5" />
      case 'radiation':
        return <ShieldAlert className="w-5 h-5" />
      case 'biological':
        return <Wind className="w-5 h-5" />
      case 'environmental':
        return <Thermometer className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }
  const getSeverityColor = (severity: HazardLevel) => {
    switch (severity) {
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  const getSeverityBadge = (severity: HazardLevel) => {
    switch (severity) {
      case 'low':
        return (
          <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
            Low Risk
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
            Medium Risk
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            High Risk
          </Badge>
        )
      case 'critical':
        return (
          <Badge variant="destructive" className="text-xs bg-red-600">
            Critical Risk
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        )
    }
  }
  const getHazardTypeLabel = (type: ExtendedHazard['type']) => {
    switch (type) {
      case 'fire':
        return 'Flammable'
      case 'toxic':
        return 'Toxic'
      case 'corrosive':
        return 'Corrosive'
      case 'explosive':
        return 'Explosive'
      case 'electrical':
        return 'Electrical'
      case 'radiation':
        return 'Radioactive'
      case 'biological':
        return 'Biohazard'
      case 'environmental':
        return 'Environmental'
      default:
        return 'Hazard'
    }
  }
  const getOverallRisk = () => {
    if (hazards.length === 0) return 'none'
    if (hazards.some((h) => h.severity === 'critical')) return 'critical'
    if (hazards.some((h) => h.severity === 'high')) return 'high'
    if (hazards.some((h) => h.severity === 'medium')) return 'medium'
    return 'low'
  }
  const overallRisk = getOverallRisk()
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {hazards.length === 0 ? (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
            No Hazards
          </Badge>
        ) : (
          <>
            <AlertTriangle
              className={cn(
                'w-4 h-4',
                overallRisk === 'critical' && 'text-red-800',
                overallRisk === 'high' && 'text-red-600',
                overallRisk === 'medium' && 'text-orange-600',
                overallRisk === 'low' && 'text-yellow-600'
              )}
            />
            <span className="text-xs font-medium">
              {hazards.length} Hazard{hazards.length !== 1 ? 's' : ''}
            </span>
            {getSeverityBadge(getMaxHazardLevel(hazards))}
          </>
        )}
      </div>
    )
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Hazard Information
            </h3>
            {materialName && (
              <p className="text-sm text-muted-foreground">Material: {materialName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {overallRisk === 'none' && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                No Hazards Identified
              </Badge>
            )}
            {overallRisk !== 'none' && (
              <>
                <AlertTriangle
                  className={cn(
                    'w-5 h-5',
                    overallRisk === 'critical' && 'text-red-800',
                    overallRisk === 'high' && 'text-red-600',
                    overallRisk === 'medium' && 'text-orange-600',
                    overallRisk === 'low' && 'text-yellow-600'
                  )}
                />
                <span className="text-sm font-medium">
                  {hazards.length} Active Hazard{hazards.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
        {/* Hazards List */}
        {hazards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hazards identified for this material</p>
            <p className="text-xs mt-1">Material is considered safe for normal handling</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hazards.map((hazard) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
              <div
                key={hazard.id}
                className={cn(
                  'p-4 rounded-lg border-l-4 transition-colors',
                  getSeverityColor(hazard.severity),
                  onHazardClick && 'cursor-pointer hover:bg-opacity-70'
                )}
                role={onHazardClick ? 'button' : undefined}
                tabIndex={onHazardClick ? 0 : undefined}
                onClick={() => onHazardClick?.(hazard)}
                onKeyDown={(e) => {
                  if (onHazardClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onHazardClick(hazard)
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        hazard.severity === 'critical' && 'bg-red-800 text-white',
                        hazard.severity === 'high' && 'bg-red-600 text-white',
                        hazard.severity === 'medium' && 'bg-orange-600 text-white',
                        hazard.severity === 'low' && 'bg-yellow-600 text-white'
                      )}
                    >
                      {getHazardIcon(hazard.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{hazard.title}</h4>
                        {getSeverityBadge(hazard.severity)}
                        <Badge variant="outline" className="text-xs">
                          {getHazardTypeLabel(hazard.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{hazard.description}</p>
                    </div>
                  </div>
                </div>
                {/* Exposure Limits */}
                {hazard.exposure && (
                  <div className="mb-3 p-3 bg-white bg-opacity-50 rounded border">
                    <h5 className="text-xs font-medium mb-2">Exposure Limits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {hazard.exposure.timeLimit && (
                        <div>
                          <span className="font-medium">Time Limit:</span>
                          <span className="ml-1">{hazard.exposure.timeLimit}</span>
                        </div>
                      )}
                      {hazard.exposure.concentration && (
                        <div>
                          <span className="font-medium">Concentration:</span>
                          <span className="ml-1">{hazard.exposure.concentration}</span>
                        </div>
                      )}
                      {hazard.exposure.temperature && (
                        <div>
                          <span className="font-medium">Temperature:</span>
                          <span className="ml-1">{hazard.exposure.temperature}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Precautions */}
                {showPrecautions && hazard.precautions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium mb-2">Safety Precautions</h5>
                    <ul className="text-xs space-y-1">
                      {hazard.precautions.map((precaution, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-current mt-1">•</span>
                          <span>{precaution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Summary Statistics */}
        {hazards.length > 0 && (
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {hazards.filter((h) => h.severity === 'critical').length}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-500">
                  {hazards.filter((h) => h.severity === 'high').length}
                </div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-500">
                  {hazards.filter((h) => h.severity === 'medium').length}
                </div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-500">
                  {hazards.filter((h) => h.severity === 'low').length}
                </div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
