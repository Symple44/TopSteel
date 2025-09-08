'use client'
import { AlertTriangle, CheckCircle, FileText, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'

interface ComplianceRule {
  id: string
  name: string
  standard: string
  category: 'chemical' | 'mechanical' | 'dimensional' | 'surface' | 'certification'
  requirement: string
  actualValue?: string | number
  expectedValue: string | number
  tolerance?: number
  unit?: string
  status: 'compliant' | 'non-compliant' | 'warning' | 'not-tested'
  priority: 'critical' | 'high' | 'medium' | 'low'
  notes?: string
}
interface ComplianceResult {
  overall: 'compliant' | 'non-compliant' | 'partial' | 'unknown'
  score: number
  checkedRules: number
  totalRules: number
  lastChecked?: Date
}
interface ComplianceCheckerProps {
  className?: string
  materialName?: string
  standards: string[]
  rules: ComplianceRule[]
  result?: ComplianceResult
  autoCheck?: boolean
  onRunCheck?: () => void
  onRuleClick?: (rule: ComplianceRule) => void
}
export function ComplianceChecker({
  className,
  materialName,
  standards,
  rules,
  result,
  autoCheck = false,
  onRunCheck,
  onRuleClick,
}: ComplianceCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const handleRunCheck = async () => {
    if (!onRunCheck) return
    setIsChecking(true)
    try {
      await onRunCheck()
    } finally {
      setIsChecking(false)
    }
  }
  const getStatusIcon = (status: ComplianceRule['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'non-compliant':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'not-tested':
        return <FileText className="w-4 h-4 text-gray-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }
  const getStatusBadge = (status: ComplianceRule['status']) => {
    switch (status) {
      case 'compliant':
        return (
          <Badge variant="default" className="text-xs">
            Compliant
          </Badge>
        )
      case 'non-compliant':
        return (
          <Badge variant="destructive" className="text-xs">
            Non-Compliant
          </Badge>
        )
      case 'warning':
        return (
          <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
            Warning
          </Badge>
        )
      case 'not-tested':
        return (
          <Badge variant="secondary" className="text-xs">
            Not Tested
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
  const getPriorityColor = (priority: ComplianceRule['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-300'
    }
  }
  const getCategoryIcon = (category: ComplianceRule['category']) => {
    switch (category) {
      case 'chemical':
        return '🧪'
      case 'mechanical':
        return '⚙️'
      case 'dimensional':
        return '📏'
      case 'surface':
        return '🔍'
      case 'certification':
        return '📜'
      default:
        return '📋'
    }
  }
  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = []
      }
      acc[rule.category].push(rule)
      return acc
    },
    {} as Record<string, ComplianceRule[]>
  )
  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600'
      case 'non-compliant':
        return 'text-red-600'
      case 'partial':
        return 'text-yellow-600'
      default:
        return 'text-gray-400'
    }
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Compliance Checker</h3>
            {materialName && (
              <p className="text-sm text-muted-foreground">Material: {materialName}</p>
            )}
            <div className="flex gap-1 mt-1">
              {standards.map((standard) => (
                <Badge key={standard} variant="outline" className="text-xs">
                  {standard}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            {result && (
              <div>
                <div className={cn('text-2xl font-bold', getComplianceColor(result.overall))}>
                  {result.score.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {result.checkedRules}/{result.totalRules} rules checked
                </div>
                {result.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    Last: {result.lastChecked.toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
            <Button
              type="button"
              onClick={handleRunCheck}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Run Check
                </>
              )}
            </Button>
          </div>
        </div>
        {/* Overall Status */}
        {result && (
          <div
            className={cn(
              'p-4 rounded-lg border-l-4',
              result.overall === 'compliant' && 'bg-green-50 border-l-green-500',
              result.overall === 'non-compliant' && 'bg-red-50 border-l-red-500',
              result.overall === 'partial' && 'bg-yellow-50 border-l-yellow-500',
              result.overall === 'unknown' && 'bg-gray-50 border-l-gray-500'
            )}
          >
            <div className="flex items-center gap-2">
              {result.overall === 'compliant' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {result.overall === 'non-compliant' && <XCircle className="w-5 h-5 text-red-600" />}
              {result.overall === 'partial' && (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              {result.overall === 'unknown' && <FileText className="w-5 h-5 text-gray-400" />}
              <span className={cn('font-medium', getComplianceColor(result.overall))}>
                {result.overall.charAt(0).toUpperCase() + result.overall.slice(1)} Compliance
              </span>
            </div>
          </div>
        )}
        {/* Rules by Category */}
        <div className="space-y-4">
          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {getCategoryIcon(category as ComplianceRule['category'])}
                </span>
                <h4 className="font-medium capitalize">{category} Compliance</h4>
                <span className="text-sm text-muted-foreground">
                  ({categoryRules.length} rules)
                </span>
              </div>
              <div className="space-y-2">
                {categoryRules.map((rule) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
                  <div
                    key={rule.id}
                    className={cn(
                      'p-3 rounded-lg border-l-4 border transition-colors',
                      getPriorityColor(rule.priority),
                      onRuleClick && 'cursor-pointer hover:bg-muted/50',
                      rule.status === 'non-compliant' && 'bg-red-50',
                      rule.status === 'warning' && 'bg-yellow-50'
                    )}
                    role={onRuleClick ? 'button' : undefined}
                    tabIndex={onRuleClick ? 0 : undefined}
                    onClick={() => onRuleClick?.(rule)}
                    onKeyDown={(e) => {
                      if (onRuleClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onRuleClick(rule)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(rule.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{rule.name}</h5>
                            {getStatusBadge(rule.status)}
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                rule.priority === 'critical' && 'border-red-200 text-red-600',
                                rule.priority === 'high' && 'border-orange-200 text-orange-600',
                                rule.priority === 'medium' && 'border-yellow-200 text-yellow-600',
                                rule.priority === 'low' && 'border-blue-200 text-blue-600'
                              )}
                            >
                              {rule.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Standard: {rule.standard}
                          </p>
                          <p className="text-xs">{rule.requirement}</p>
                          {rule.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {rule.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs ml-4">
                        {rule.actualValue !== undefined && (
                          <div>
                            <div className="font-medium">
                              Actual: {rule.actualValue}
                              {rule.unit}
                            </div>
                            <div className="text-muted-foreground">
                              Expected: {rule.expectedValue}
                              {rule.unit}
                            </div>
                            {rule.tolerance && (
                              <div className="text-muted-foreground">
                                Tolerance: ±{rule.tolerance}
                                {rule.unit}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Summary Statistics */}
        {rules.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {rules.filter((r) => r.status === 'compliant').length}
                </div>
                <div className="text-xs text-muted-foreground">Compliant</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {rules.filter((r) => r.status === 'non-compliant').length}
                </div>
                <div className="text-xs text-muted-foreground">Non-Compliant</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {rules.filter((r) => r.status === 'warning').length}
                </div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-400">
                  {rules.filter((r) => r.status === 'not-tested').length}
                </div>
                <div className="text-xs text-muted-foreground">Not Tested</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
