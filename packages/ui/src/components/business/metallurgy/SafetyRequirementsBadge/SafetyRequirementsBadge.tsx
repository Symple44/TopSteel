'use client'
import React from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Shield, Eye, HardHat, Zap, Flame, Droplets } from 'lucide-react'
interface SafetyRequirement {
  type: 'ppe' | 'ventilation' | 'temperature' | 'electrical' | 'fire' | 'chemical' | 'general'
  level: 'mandatory' | 'recommended' | 'conditional'
  description: string
  icon?: string
}
interface SafetyRequirementsBadgeProps {
  className?: string
  requirements: SafetyRequirement[]
  materialName?: string
  compact?: boolean
  showIcons?: boolean
  maxDisplay?: number
}
export function SafetyRequirementsBadge({ 
  className, 
  requirements,
  materialName,
  compact = false,
  showIcons = true,
  maxDisplay = 3
}: SafetyRequirementsBadgeProps) {
  const getRequirementIcon = (type: SafetyRequirement['type']) => {
    switch (type) {
      case 'ppe': return <HardHat className="w-3 h-3" />
      case 'ventilation': return <Droplets className="w-3 h-3" />
      case 'temperature': return <Flame className="w-3 h-3" />
      case 'electrical': return <Zap className="w-3 h-3" />
      case 'fire': return <Flame className="w-3 h-3" />
      case 'chemical': return <Eye className="w-3 h-3" />
      default: return <Shield className="w-3 h-3" />
    }
  }
  const getLevelColor = (level: SafetyRequirement['level']) => {
    switch (level) {
      case 'mandatory': return 'border-red-200 text-red-600 bg-red-50'
      case 'recommended': return 'border-yellow-200 text-yellow-600 bg-yellow-50'
      case 'conditional': return 'border-blue-200 text-blue-600 bg-blue-50'
      default: return 'border-gray-200 text-gray-600 bg-gray-50'
    }
  }
  const mandatoryCount = requirements.filter(r => r.level === 'mandatory').length
  const recommendedCount = requirements.filter(r => r.level === 'recommended').length
  if (requirements.length === 0) {
    return (
      <Badge variant="outline" className={cn("text-xs text-green-600 border-green-200", className)}>
        <Shield className="w-3 h-3 mr-1" />
        No Special Requirements
      </Badge>
    )
  }
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {mandatoryCount > 0 && (
          <Badge variant="outline" className="text-xs border-red-200 text-red-600">
            <Shield className="w-3 h-3 mr-1" />
            {mandatoryCount} Required
          </Badge>
        )}
        {recommendedCount > 0 && (
          <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
            {recommendedCount} Recommended
          </Badge>
        )}
      </div>
    )
  }
  const displayRequirements = requirements.slice(0, maxDisplay)
  const hiddenCount = requirements.length - maxDisplay
  return (
    <div className={cn("space-y-2", className)}>
      {materialName && (
        <div className="text-xs font-medium text-muted-foreground">
          Safety Requirements - {materialName}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {displayRequirements.map((requirement, index) => (
          <Badge 
            key={index}
            variant="outline" 
            className={cn("text-xs", getLevelColor(requirement.level))}
            title={requirement.description}
          >
            {showIcons && getRequirementIcon(requirement.type)}
            <span className={showIcons ? "ml-1" : ""}>
              {requirement.description}
            </span>
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{hiddenCount} more
          </Badge>
        )}
      </div>
      {requirements.length > 0 && (
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded"></div>
            <span>Mandatory ({mandatoryCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded"></div>
            <span>Recommended ({recommendedCount})</span>
          </div>
        </div>
      )}
    </div>
  )
}
