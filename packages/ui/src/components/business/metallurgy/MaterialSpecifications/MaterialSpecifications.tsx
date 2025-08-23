'use client'
import React from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { FileText, Check, X, AlertTriangle, Info } from 'lucide-react'
interface Specification {
  id: string
  category: 'chemical' | 'mechanical' | 'dimensional' | 'surface' | 'thermal' | 'other'
  parameter: string
  requirement: string
  unit?: string
  minValue?: number
  maxValue?: number
  nominalValue?: number
  tolerance?: number
  testMethod: string
  standard: string
  mandatory: boolean
  status?: 'compliant' | 'non-compliant' | 'not-tested'
  actualValue?: number
  notes?: string
}
interface MaterialSpecificationsProps {
  className?: string
  materialName: string
  grade: string
  standard: string
  specifications: Specification[]
  showStatus?: boolean
  onSpecificationClick?: (spec: Specification) => void
}
export function MaterialSpecifications({ 
  className, 
  materialName,
  grade,
  standard,
  specifications,
  showStatus = false,
  onSpecificationClick
}: MaterialSpecificationsProps) {
  const getCategoryIcon = (category: Specification['category']) => {
    switch (category) {
      case 'chemical': return '🧪'
      case 'mechanical': return '⚙️'
      case 'dimensional': return '📏'
      case 'surface': return '🔍'
      case 'thermal': return '🌡️'
      default: return '📋'
    }
  }
  const getStatusIcon = (status?: Specification['status']) => {
    switch (status) {
      case 'compliant':
        return <Check className="w-4 h-4 text-green-600" />
      case 'non-compliant':
        return <X className="w-4 h-4 text-red-600" />
      case 'not-tested':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Info className="w-4 h-4 text-gray-400" />
    }
  }
  const getStatusBadge = (status?: Specification['status']) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="success" className="text-xs">Compliant</Badge>
      case 'non-compliant':
        return <Badge variant="destructive" className="text-xs">Non-Compliant</Badge>
      case 'not-tested':
        return <Badge variant="secondary" className="text-xs">Not Tested</Badge>
      default:
        return null
    }
  }
  const formatRequirement = (spec: Specification) => {
    if (spec.nominalValue !== undefined) {
      const tolerance = spec.tolerance ? ` ±${spec.tolerance}` : ''
      return `${spec.nominalValue}${tolerance}${spec.unit || ''}`
    }
    if (spec.minValue !== undefined && spec.maxValue !== undefined) {
      return `${spec.minValue} - ${spec.maxValue}${spec.unit || ''}`
    }
    if (spec.minValue !== undefined) {
      return `≥ ${spec.minValue}${spec.unit || ''}`
    }
    if (spec.maxValue !== undefined) {
      return `≤ ${spec.maxValue}${spec.unit || ''}`
    }
    return spec.requirement
  }
  const groupedSpecs = specifications.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = []
    }
    acc[spec.category].push(spec)
    return acc
  }, {} as Record<string, Specification[]>)
  const getComplianceStats = () => {
    if (!showStatus) return null
    const compliant = specifications.filter(s => s.status === 'compliant').length
    const nonCompliant = specifications.filter(s => s.status === 'non-compliant').length
    const notTested = specifications.filter(s => s.status === 'not-tested').length
    const total = specifications.length
    return { compliant, nonCompliant, notTested, total }
  }
  const stats = getComplianceStats()
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Material Specifications
            </h3>
            <p className="text-sm text-muted-foreground">
              {materialName} - Grade {grade} ({standard})
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {((stats.compliant / stats.total) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.compliant}/{stats.total} compliant
              </div>
            </div>
          )}
        </div>
        {/* Compliance Summary */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.compliant}</div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{stats.nonCompliant}</div>
              <div className="text-xs text-muted-foreground">Non-Compliant</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{stats.notTested}</div>
              <div className="text-xs text-muted-foreground">Not Tested</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {specifications.filter(s => s.mandatory).length}
              </div>
              <div className="text-xs text-muted-foreground">Mandatory</div>
            </div>
          </div>
        )}
        {/* Specifications by Category */}
        <div className="space-y-6">
          {Object.entries(groupedSpecs).map(([category, categorySpecs]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 capitalize">
                <span className="text-lg">{getCategoryIcon(category as Specification['category'])}</span>
                {category} Specifications
                <span className="text-sm text-muted-foreground">({categorySpecs.length})</span>
              </h4>
              <div className="space-y-2">
                {categorySpecs.map((spec) => (
                  <div 
                    key={spec.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      onSpecificationClick && "cursor-pointer hover:bg-muted/50",
                      spec.status === 'non-compliant' && "border-red-200 bg-red-50",
                      spec.status === 'compliant' && "border-green-200 bg-green-50",
                      spec.mandatory && "border-l-4 border-l-blue-500"
                    )}
                    onClick={() => onSpecificationClick?.(spec)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-sm">{spec.parameter}</h5>
                          {spec.mandatory && (
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                              Mandatory
                            </Badge>
                          )}
                          {showStatus && getStatusBadge(spec.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requirement:</span>
                            <div className="font-medium">{formatRequirement(spec)}</div>
                          </div>
                          {showStatus && spec.actualValue !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Actual Value:</span>
                              <div className={cn(
                                "font-medium",
                                spec.status === 'compliant' && "text-green-600",
                                spec.status === 'non-compliant' && "text-red-600"
                              )}>
                                {spec.actualValue}{spec.unit}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Test Method:</span>
                            <div className="font-medium">{spec.testMethod}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Standard: {spec.standard}
                        </div>
                        {spec.notes && (
                          <div className="mt-2 text-xs italic text-muted-foreground">
                            {spec.notes}
                          </div>
                        )}
                      </div>
                      {showStatus && (
                        <div className="ml-4">
                          {getStatusIcon(spec.status)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="pt-4 border-t">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-blue-500 rounded"></div>
              <span>Mandatory Specification</span>
            </div>
            {showStatus && (
              <>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="w-3 h-3 text-red-600" />
                  <span>Non-Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  <span>Not Tested</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
