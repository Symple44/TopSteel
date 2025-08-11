'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../layout/card'
import { Badge } from '../../../data-display/badge'
import { Progress } from '../../../primitives/progress'
import { Separator } from '../../../primitives/separator'
import { Alert, AlertDescription } from '../../../feedback/alert'
import { SimpleTooltip } from '../../../primitives/tooltip'
import { Button } from '../../../primitives/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../../../primitives/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../data-display/table'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Info,
  AlertCircle,
  Package,
  User,
  Hash,
  DollarSign,
  Percent,
  Calculator,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Copy
} from 'lucide-react'
import type React from 'react'
import { useState, useMemo } from 'react'
import { cn } from '../../../../lib/utils'

export interface PriceBreakdownProps {
  breakdown: {
    steps: Array<{
      stepNumber: number
      ruleName: string
      ruleId: string
      priceBefore: number
      priceAfter: number
      adjustment: number
      adjustmentType: string
      description: string
    }>
    skippedRules?: Array<{
      ruleId: string
      ruleName: string
      reason: string
      priority: number
    }>
    context: {
      article: {
        id: string
        reference: string
        designation: string
        famille?: string
        dimensions?: {
          poids?: number
          longueur?: number
          largeur?: number
          hauteur?: number
          surface?: number
          volume?: number
        }
        units?: {
          stock?: string
          vente?: string
          achat?: string
        }
      }
      customer?: {
        id?: string
        group?: string
        email?: string
      }
      quantity: number
      channel: string
    }
    margins?: {
      costPrice?: number
      sellingPrice: number
      margin: number
      marginPercentage: number
      markupPercentage: number
    }
    metadata?: {
      calculationTime: number
      rulesEvaluated: number
      rulesApplied: number
      cacheHit: boolean
    }
  }
  basePrice: number
  finalPrice: number
  currency?: string
  className?: string
  showDetails?: boolean
  collapsible?: boolean
  onExport?: () => void
  onCopy?: () => void
}

const formatCurrency = (value: number, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

const getAdjustmentIcon = (adjustment: number) => {
  if (adjustment > 0) return <TrendingUp className="w-4 h-4 text-red-500" />
  if (adjustment < 0) return <TrendingDown className="w-4 h-4 text-green-500" />
  return <Minus className="w-4 h-4 text-gray-400" />
}

const getAdjustmentColor = (adjustment: number) => {
  if (adjustment > 0) return 'text-red-600'
  if (adjustment < 0) return 'text-green-600'
  return 'text-gray-600'
}

export function PriceBreakdown({
  breakdown,
  basePrice,
  finalPrice,
  currency = 'EUR',
  className,
  showDetails = true,
  collapsible = true,
  onExport,
  onCopy
}: PriceBreakdownProps) {
  const [expandedSections, setExpandedSections] = useState({
    steps: true,
    context: !collapsible,
    skipped: false,
    margins: true,
    metadata: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    if (!collapsible && section === 'context') return
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const totalDiscount = basePrice - finalPrice
  const totalDiscountPercentage = basePrice > 0 ? (totalDiscount / basePrice) * 100 : 0

  const priceEvolution = useMemo(() => {
    if (!breakdown.steps.length) return []
    
    const evolution = [{ step: 0, price: basePrice, label: 'Prix de base' }]
    breakdown.steps.forEach(step => {
      evolution.push({
        step: step.stepNumber,
        price: step.priceAfter,
        label: step.ruleName
      })
    })
    return evolution
  }, [breakdown.steps, basePrice])

  const renderStepsTimeline = () => (
    <div className="space-y-4">
      {/* Prix de base */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium">
          0
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">Prix de base</span>
            <span className="font-mono text-lg">{formatCurrency(basePrice, currency)}</span>
          </div>
        </div>
      </div>

      {/* Étapes de calcul */}
      {breakdown.steps.map((step, index) => {
        const isLastStep = index === breakdown.steps.length - 1
        const adjustmentPercent = step.priceBefore > 0 
          ? ((step.priceAfter - step.priceBefore) / step.priceBefore) * 100 
          : 0

        return (
          <div key={step.ruleId} className="relative">
            {/* Ligne de connexion */}
            {!isLastStep && (
              <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-sm font-medium z-10">
                {step.stepNumber}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.ruleName}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.adjustmentType}
                    </Badge>
                  </div>
                  {getAdjustmentIcon(step.adjustment)}
                </div>
                
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono">{formatCurrency(step.priceBefore, currency)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className={cn('font-mono font-medium', getAdjustmentColor(step.adjustment))}>
                    {formatCurrency(step.priceAfter, currency)}
                  </span>
                  <Badge 
                    variant={step.adjustment < 0 ? 'default' : 'destructive'} 
                    className="text-xs"
                  >
                    {formatPercentage(adjustmentPercent)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Prix final */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">Prix final</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-green-600">
                {formatCurrency(finalPrice, currency)}
              </span>
              {totalDiscount !== 0 && (
                <Badge variant={totalDiscount > 0 ? 'default' : 'destructive'}>
                  {formatPercentage(totalDiscountPercentage)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    section: keyof typeof expandedSections,
    content: React.ReactNode,
    badge?: React.ReactNode
  ) => {
    if (collapsible) {
      return (
        <Collapsible open={expandedSections[section]}>
          <CollapsibleTrigger
            onClick={() => toggleSection(section)}
            className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium">{title}</span>
              {badge}
            </div>
            {expandedSections[section] ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">{content}</div>
          </CollapsibleContent>
        </Collapsible>
      )
    }
    
    return (
      <div>
        <div className="flex items-center gap-2 p-4">
          {icon}
          <span className="font-medium">{title}</span>
          {badge}
        </div>
        <div className="px-4 pb-4">{content}</div>
      </div>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Décomposition du prix</CardTitle>
            <CardDescription>
              Détail du calcul étape par étape
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onCopy && (
              <SimpleTooltip content="Copier">
                <Button variant="outline" size="sm" onClick={onCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </SimpleTooltip>
            )}
            {onExport && (
              <SimpleTooltip content="Exporter">
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4" />
                </Button>
              </SimpleTooltip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-px">
        {/* Résumé principal */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Prix de base</p>
              <p className="text-lg font-mono">{formatCurrency(basePrice, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ajustement total</p>
              <p className={cn('text-lg font-mono', getAdjustmentColor(finalPrice - basePrice))}>
                {formatCurrency(finalPrice - basePrice, currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prix final</p>
              <p className="text-lg font-mono font-bold text-green-600">
                {formatCurrency(finalPrice, currency)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Étapes de calcul */}
        {renderSection(
          'Étapes de calcul',
          <Calculator className="w-4 h-4" />,
          'steps',
          renderStepsTimeline(),
          <Badge variant="secondary">{breakdown.steps.length} règles</Badge>
        )}

        {showDetails && (
          <>
            <Separator />

            {/* Contexte */}
            {renderSection(
              'Contexte',
              <Info className="w-4 h-4" />,
              'context',
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Article
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Référence:</span>{' '}
                      <span className="font-mono">{breakdown.context.article.reference}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Désignation:</span>{' '}
                      {breakdown.context.article.designation}
                    </div>
                    {breakdown.context.article.famille && (
                      <div>
                        <span className="text-muted-foreground">Famille:</span>{' '}
                        {breakdown.context.article.famille}
                      </div>
                    )}
                  </div>
                </div>

                {breakdown.context.customer && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Client
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {breakdown.context.customer.group && (
                        <div>
                          <span className="text-muted-foreground">Groupe:</span>{' '}
                          <Badge variant="outline">{breakdown.context.customer.group}</Badge>
                        </div>
                      )}
                      {breakdown.context.customer.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span>{' '}
                          {breakdown.context.customer.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span className="text-muted-foreground">Quantité:</span>
                    <span className="font-medium">{breakdown.context.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-muted-foreground">Canal:</span>
                    <Badge variant="outline">{breakdown.context.channel}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Règles non appliquées */}
            {breakdown.skippedRules && breakdown.skippedRules.length > 0 && (
              <>
                <Separator />
                {renderSection(
                  'Règles non appliquées',
                  <XCircle className="w-4 h-4" />,
                  'skipped',
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Règle</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Raison</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdown.skippedRules.map(rule => (
                        <TableRow key={rule.ruleId}>
                          <TableCell>{rule.ruleName}</TableCell>
                          <TableCell>{rule.priority}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.reason}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>,
                  <Badge variant="outline">{breakdown.skippedRules.length}</Badge>
                )}
              </>
            )}

            {/* Marges */}
            {breakdown.margins && (
              <>
                <Separator />
                {renderSection(
                  'Marges',
                  <Percent className="w-4 h-4" />,
                  'margins',
                  <div className="space-y-3">
                    {breakdown.margins.costPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prix d'achat</span>
                        <span className="font-mono">{formatCurrency(breakdown.margins.costPrice, currency)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prix de vente</span>
                      <span className="font-mono">{formatCurrency(breakdown.margins.sellingPrice, currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Marge</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {formatCurrency(breakdown.margins.margin, currency)}
                        </span>
                        <Badge variant={breakdown.margins.margin > 0 ? 'default' : 'destructive'}>
                          {breakdown.margins.marginPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={Math.max(0, Math.min(100, breakdown.margins.marginPercentage))} 
                      className="h-2"
                    />
                  </div>
                )}
              </>
            )}

            {/* Métadonnées */}
            {breakdown.metadata && (
              <>
                <Separator />
                {renderSection(
                  'Informations techniques',
                  <Clock className="w-4 h-4" />,
                  'metadata',
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Temps de calcul:</span>{' '}
                      <span className="font-mono">{breakdown.metadata.calculationTime}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Règles évaluées:</span>{' '}
                      <span className="font-mono">{breakdown.metadata.rulesEvaluated}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Règles appliquées:</span>{' '}
                      <span className="font-mono">{breakdown.metadata.rulesApplied}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cache:</span>{' '}
                      <Badge variant={breakdown.metadata.cacheHit ? 'default' : 'outline'}>
                        {breakdown.metadata.cacheHit ? 'Hit' : 'Miss'}
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}