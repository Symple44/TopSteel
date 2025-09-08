'use client'
import { Activity, Gauge, Target, TrendingUp } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'

interface MechanicalProperty {
  name: string
  value: number
  unit: string
  direction?: 'longitudinal' | 'transverse' | 'through-thickness'
  temperature?: number
  standard?: string
  testMethod?: string
  sampleSize?: number
  confidence?: number
  grade?: 'excellent' | 'good' | 'acceptable' | 'poor'
}
interface MechanicalPropertiesProps {
  className?: string
  materialName: string
  properties: {
    tensileStrength?: MechanicalProperty
    yieldStrength?: MechanicalProperty
    elongation?: MechanicalProperty
    hardness?: MechanicalProperty
    impactEnergy?: MechanicalProperty
    fatigueLimit?: MechanicalProperty
    modulusOfElasticity?: MechanicalProperty
    poissonRatio?: MechanicalProperty
    [key: string]: MechanicalProperty | undefined
  }
  showComparison?: boolean
  comparisonData?: { [key: string]: number }
  onPropertyClick?: (property: MechanicalProperty) => void
}
export function MechanicalProperties({
  className,
  materialName,
  properties,
  showComparison = false,
  comparisonData,
  onPropertyClick,
}: MechanicalPropertiesProps) {
  const getPropertyIcon = (name: string) => {
    if (name.toLowerCase().includes('strength')) return <Target className="w-4 h-4" />
    if (name.toLowerCase().includes('hardness')) return <Gauge className="w-4 h-4" />
    if (name.toLowerCase().includes('elongation')) return <TrendingUp className="w-4 h-4" />
    if (name.toLowerCase().includes('impact')) return <Activity className="w-4 h-4" />
    return <Gauge className="w-4 h-4" />
  }
  const getGradeBadge = (grade?: string) => {
    switch (grade) {
      case 'excellent':
        return (
          <Badge variant="default" className="text-xs">
            Excellent
          </Badge>
        )
      case 'good':
        return (
          <Badge variant="outline" className="text-xs border-green-200 text-green-600">
            Good
          </Badge>
        )
      case 'acceptable':
        return (
          <Badge variant="secondary" className="text-xs">
            Acceptable
          </Badge>
        )
      case 'poor':
        return (
          <Badge variant="destructive" className="text-xs">
            Poor
          </Badge>
        )
      default:
        return null
    }
  }
  const getComparisonPercentage = (propertyName: string, value: number) => {
    if (!showComparison || !comparisonData || !comparisonData[propertyName]) return null
    return ((value / comparisonData[propertyName]) * 100).toFixed(0)
  }
  const formatValue = (value: number, unit: string) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${unit}`
    }
    return `${value.toFixed(1)} ${unit}`
  }
  const getDirectionIcon = (direction?: string) => {
    switch (direction) {
      case 'longitudinal':
        return '↔️'
      case 'transverse':
        return '↕️'
      case 'through-thickness':
        return '⬆️'
      default:
        return '🔄'
    }
  }
  const mainProperties = [
    {
      key: 'tensileStrength',
      label: 'Tensile Strength',
      color: 'bg-red-50 border-red-200 text-red-700',
    },
    {
      key: 'yieldStrength',
      label: 'Yield Strength',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
      key: 'elongation',
      label: 'Elongation',
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    { key: 'hardness', label: 'Hardness', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ]
  const additionalProperties = Object.entries(properties).filter(
    ([key]) => !mainProperties.some((p) => p.key === key) && properties[key]
  )
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Mechanical Properties
          </h3>
          <p className="text-sm text-muted-foreground">{materialName}</p>
        </div>
        {/* Main Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainProperties.map(({ key, label, color }) => {
            const property = properties[key]
            if (!property) return null
            const comparisonPercent = getComparisonPercentage(key, property.value)
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
              <div
                key={key}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  color,
                  onPropertyClick && 'cursor-pointer hover:bg-opacity-70'
                )}
                role={onPropertyClick ? 'button' : undefined}
                tabIndex={onPropertyClick ? 0 : undefined}
                onClick={() => onPropertyClick?.(property)}
                onKeyDown={(e) => {
                  if (onPropertyClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onPropertyClick(property)
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPropertyIcon(label)}
                    <h4 className="font-medium">{label}</h4>
                    {property.direction && (
                      <span className="text-lg" title={property.direction}>
                        {getDirectionIcon(property.direction)}
                      </span>
                    )}
                  </div>
                  {getGradeBadge(property.grade)}
                </div>
                <div className="text-2xl font-bold mb-2">
                  {formatValue(property.value, property.unit)}
                </div>
                {comparisonPercent && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>vs. Reference</span>
                      <span>{comparisonPercent}%</span>
                    </div>
                    <Progress
                      value={Math.min(parseFloat(comparisonPercent), 200)}
                      className="h-2"
                    />
                  </div>
                )}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {property.temperature && <div>Temperature: {property.temperature}°C</div>}
                  {property.standard && <div>Standard: {property.standard}</div>}
                  {property.testMethod && <div>Test: {property.testMethod}</div>}
                  {property.sampleSize && <div>Sample size: {property.sampleSize}</div>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Additional Properties */}
        {additionalProperties.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Additional Properties</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {additionalProperties.map(([key, property]) => {
                if (!property) return null
                const comparisonPercent = getComparisonPercentage(key, property.value)
                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
                  <div
                    key={key}
                    className={cn(
                      'p-3 rounded-lg border bg-gray-50 border-gray-200 transition-colors',
                      onPropertyClick && 'cursor-pointer hover:bg-gray-100'
                    )}
                    role={onPropertyClick ? 'button' : undefined}
                    tabIndex={onPropertyClick ? 0 : undefined}
                    onClick={() => onPropertyClick?.(property)}
                    onKeyDown={(e) => {
                      if (onPropertyClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onPropertyClick(property)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h5>
                      {property.direction && (
                        <span className="text-sm" title={property.direction}>
                          {getDirectionIcon(property.direction)}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {formatValue(property.value, property.unit)}
                    </div>
                    {comparisonPercent && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>vs. Ref</span>
                          <span>{comparisonPercent}%</span>
                        </div>
                        <Progress
                          value={Math.min(parseFloat(comparisonPercent), 200)}
                          className="h-1"
                        />
                      </div>
                    )}
                    {property.testMethod && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {property.testMethod}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Property Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-red-600">
                {properties.tensileStrength?.value.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Tensile (MPa)</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-orange-600">
                {properties.yieldStrength?.value.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Yield (MPa)</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">
                {properties.elongation?.value.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Elongation (%)</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">
                {properties.hardness?.value.toFixed(0) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Hardness</div>
            </div>
          </div>
        </div>
        {/* Test Conditions */}
        <div className="pt-3 border-t text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            {Object.values(properties).some((p) => p?.temperature) && (
              <div>
                Test Temperature:{' '}
                {Object.values(properties).find((p) => p?.temperature)?.temperature}°C
              </div>
            )}
            {Object.values(properties).some((p) => p?.confidence) && (
              <div>
                Confidence: {Object.values(properties).find((p) => p?.confidence)?.confidence}%
              </div>
            )}
            <div>Properties based on standard test methods</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
