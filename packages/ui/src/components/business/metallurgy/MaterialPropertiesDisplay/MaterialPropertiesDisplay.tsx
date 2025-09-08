'use client'
import { Atom, Gauge, Info, Layers, Thermometer, Zap } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { MaterialPropertyCategory } from '../../../../types/variants'
import {
  getCategoryColor as getTypeCategoryColor,
  normalizeMaterialCategory,
} from '../../../../types/variants'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'

interface MaterialProperty {
  name: string
  value: number | string
  unit?: string
  category: MaterialPropertyCategory
  standard?: string
  testMethod?: string
  tolerance?: {
    min: number
    max: number
  }
  grade?: 'A' | 'B' | 'C' | 'D'
  notes?: string
}
interface MaterialInfo {
  name: string
  grade: string
  standard: string
  description?: string
  applications?: string[]
  composition?: {
    element: string
    percentage: number
  }[]
}
interface MaterialPropertiesDisplayProps {
  className?: string
  material: MaterialInfo
  properties: MaterialProperty[]
  showCategories?: boolean
  showComparison?: boolean
  comparisonStandard?: MaterialProperty[]
  onPropertyClick?: (property: MaterialProperty) => void
}
export function MaterialPropertiesDisplay({
  className,
  material,
  properties,
  showCategories = true,
  showComparison = false,
  comparisonStandard,
  onPropertyClick,
}: MaterialPropertiesDisplayProps) {
  const getCategoryIcon = (category: MaterialProperty['category']) => {
    switch (category) {
      case 'physical':
        return <Atom className="w-4 h-4" />
      case 'mechanical':
        return <Gauge className="w-4 h-4" />
      case 'thermal':
        return <Thermometer className="w-4 h-4" />
      case 'electrical':
        return <Zap className="w-4 h-4" />
      case 'chemical':
        return <Layers className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }
  const getCategoryColor = (category: MaterialProperty['category']) => {
    switch (category) {
      case 'physical':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'mechanical':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'thermal':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'electrical':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'chemical':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }
  const getGradeBadge = (grade?: string) => {
    if (!grade) return null
    const gradeColors = {
      A: 'bg-green-100 text-green-800 border-green-200',
      B: 'bg-blue-100 text-blue-800 border-blue-200',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      D: 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return (
      <Badge
        variant="outline"
        className={cn('text-xs', gradeColors[grade as keyof typeof gradeColors])}
      >
        Grade {grade}
      </Badge>
    )
  }
  const formatValue = (property: MaterialProperty) => {
    if (typeof property.value === 'string') return property.value
    // Format numbers based on magnitude
    const value = property.value
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    if (value < 1 && value > 0) return value.toFixed(3)
    return value.toFixed(1)
  }
  const getComparisonPercentage = (property: MaterialProperty) => {
    if (!showComparison || !comparisonStandard) return null
    const standardProp = comparisonStandard.find((p) => p.name === property.name)
    if (
      !standardProp ||
      typeof property.value !== 'number' ||
      typeof standardProp.value !== 'number'
    )
      return null
    return ((property.value / standardProp.value) * 100).toFixed(0)
  }
  const groupedProperties = properties.reduce(
    (acc, property) => {
      if (!acc[property.category]) {
        acc[property.category] = []
      }
      acc[property.category].push(property)
      return acc
    },
    {} as Record<string, MaterialProperty[]>
  )
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{material.name}</h3>
              <p className="text-sm text-muted-foreground">
                Grade: {material.grade} • Standard: {material.standard}
              </p>
            </div>
            {getGradeBadge(material.grade)}
          </div>
          {material.description && (
            <p className="text-sm text-muted-foreground">{material.description}</p>
          )}
          {material.applications && material.applications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Applications</h4>
              <div className="flex flex-wrap gap-1">
                {material.applications.map((app, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {app}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Chemical Composition */}
        {material.composition && material.composition.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Chemical Composition
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {material.composition.map((comp, index) => (
                <div key={index} className="text-center p-2 bg-muted rounded">
                  <div className="font-medium text-sm">{comp.element}</div>
                  <div className="text-xs text-muted-foreground">{comp.percentage.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Properties by Category */}
        {showCategories ? (
          <div className="space-y-6">
            {Object.entries(groupedProperties).map(([category, categoryProperties]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 capitalize">
                  {getCategoryIcon(category as MaterialProperty['category'])}
                  {category} Properties
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryProperties.map((property, index) => {
                    const comparisonPercent = getComparisonPercentage(property)
                    return (
                      // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border transition-colors',
                          getCategoryColor(property.category),
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
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-sm">{property.name}</h5>
                            {property.grade && getGradeBadge(property.grade)}
                          </div>
                          <div className="text-lg font-bold">
                            {formatValue(property)}
                            {property.unit && (
                              <span className="text-sm font-normal ml-1">{property.unit}</span>
                            )}
                          </div>
                          {property.tolerance && (
                            <div className="text-xs text-muted-foreground">
                              Tolerance: {property.tolerance.min} - {property.tolerance.max}
                              {property.unit}
                            </div>
                          )}
                          {comparisonPercent && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>vs. Standard</span>
                                <span>{comparisonPercent}%</span>
                              </div>
                              <Progress
                                value={Math.min(parseFloat(comparisonPercent), 200)}
                                className="h-1"
                              />
                            </div>
                          )}
                          {property.standard && (
                            <div className="text-xs text-muted-foreground">
                              Standard: {property.standard}
                            </div>
                          )}
                          {property.testMethod && (
                            <div className="text-xs text-muted-foreground">
                              Test: {property.testMethod}
                            </div>
                          )}
                          {property.notes && (
                            <div className="text-xs italic text-muted-foreground">
                              {property.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* All Properties in One List */
          <div className="space-y-3">
            <h4 className="font-medium">Material Properties</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {properties.map((property, index) => {
                const comparisonPercent = getComparisonPercentage(property)
                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      getCategoryColor(property.category),
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
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium text-sm">{property.name}</h5>
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(property.category)}
                          {property.grade && getGradeBadge(property.grade)}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        {formatValue(property)}
                        {property.unit && (
                          <span className="text-sm font-normal ml-1">{property.unit}</span>
                        )}
                      </div>
                      {comparisonPercent && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>vs. Standard</span>
                            <span>{comparisonPercent}%</span>
                          </div>
                          <Progress
                            value={Math.min(parseFloat(comparisonPercent), 200)}
                            className="h-1"
                          />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground capitalize">
                        {property.category} Property
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Summary Statistics */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {Object.entries(groupedProperties).map(([category, categoryProperties]) => (
              <div key={category} className="space-y-1">
                <div
                  className={cn(
                    'text-lg font-semibold',
                    getTypeCategoryColor(normalizeMaterialCategory(category))
                  )}
                >
                  {categoryProperties.length}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
