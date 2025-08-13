'use client'

import {
  AlertCircle,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Package,
  Play,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Alert, AlertDescription, AlertTitle } from '../../../feedback/alert'
import { Label } from '../../../forms/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../layout/card'
import { Separator } from '../../../layout/separator'
import { Button } from '../../../primitives/button'
import { Input } from '../../../primitives/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select'
import type { PriceRule } from '../PriceRuleCard/PriceRuleCard'
import { PriceRuleChannel } from '../PriceRuleCard/PriceRuleCard'

export interface SimulationContext {
  articleId?: string
  articleReference?: string
  articleFamily?: string
  customerId?: string
  customerGroup?: string
  customerEmail?: string
  quantity: number
  channel: PriceRuleChannel
  societeId?: string

  // Données article pour simulation
  article?: {
    id: string
    reference: string
    designation: string
    famille?: string
    prixVenteHT: number
    poids?: number
    longueur?: number
    largeur?: number
    hauteur?: number
    surface?: number
    volume?: number
    uniteStock?: string
    uniteVente?: string
    coefficientVente?: number
  }
}

export interface SimulationResult {
  basePrice: number
  finalPrice: number
  currency: string
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    ruleType: string
    adjustment: number
    adjustmentUnit?: string
    discountAmount: number
    discountPercentage: number
  }>
  skippedRules?: Array<{
    ruleId: string
    ruleName: string
    reason: string
  }>
  totalDiscount: number
  totalDiscountPercentage: number
  unitPrice?: {
    value: number
    unit: string
  }
  warnings?: string[]
}

export interface PriceSimulatorProps {
  onSimulate: (context: SimulationContext) => Promise<SimulationResult>
  availableArticles?: Array<{
    id: string
    reference: string
    designation: string
    famille?: string
    prixVenteHT: number
    poids?: number
  }>
  availableRules?: PriceRule[]
  className?: string
  defaultContext?: Partial<SimulationContext>
}

const SAMPLE_ARTICLES = [
  {
    id: '1',
    reference: 'IPE140-S275JR',
    designation: 'IPE 140 - Acier S275JR',
    famille: 'ACIER',
    prixVenteHT: 19.9,
    poids: 12.9,
  },
  {
    id: '2',
    reference: 'TUB-40x40x3',
    designation: 'Tube carré 40x40x3',
    famille: 'TUBES',
    prixVenteHT: 8.5,
    poids: 3.41,
  },
  {
    id: '3',
    reference: 'TOLE-2MM-1000',
    designation: 'Tôle 2mm 1000x2000',
    famille: 'TOLES',
    prixVenteHT: 45.0,
    poids: 31.4,
    surface: 2,
  },
]

const CUSTOMER_GROUPS = [
  { value: '', label: 'Aucun groupe' },
  { value: 'VIP', label: 'Client VIP' },
  { value: 'GROSSISTE', label: 'Grossiste' },
  { value: 'PROFESSIONNEL', label: 'Professionnel' },
  { value: 'PARTICULIER', label: 'Particulier' },
]

export function PriceSimulator({
  onSimulate,
  availableArticles = SAMPLE_ARTICLES,
  availableRules = [],
  className,
  defaultContext,
}: PriceSimulatorProps) {
  const [context, setContext] = useState<SimulationContext>({
    quantity: 1,
    channel: PriceRuleChannel.ERP,
    ...defaultContext,
  })

  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const selectedArticle = useMemo(() => {
    return availableArticles.find((a) => a.id === context.articleId)
  }, [context.articleId, availableArticles])

  const updateContext = useCallback(
    (field: keyof SimulationContext, value: string | number | undefined | PriceRuleChannel) => {
      setContext((prev) => {
        const updated = { ...prev, [field]: value }

        // Si on change l'article, mettre à jour les données
        if (field === 'articleId') {
          const article = availableArticles.find((a) => a.id === value)
          if (article) {
            updated.article = {
              ...article,
              uniteVente: article.poids ? 'KG' : 'U',
              coefficientVente: 1,
            }
            updated.articleReference = article.reference
            updated.articleFamily = article.famille
          }
        }

        return updated
      })

      // Réinitialiser le résultat si on change le contexte
      setResult(null)
    },
    [availableArticles]
  )

  const handleSimulate = useCallback(async () => {
    if (!context.articleId) {
      setError('Veuillez sélectionner un article')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const simulationResult = await onSimulate(context)
      setResult(simulationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la simulation')
    } finally {
      setLoading(false)
    }
  }, [context, onSimulate])

  const handleReset = useCallback(() => {
    setContext({
      quantity: 1,
      channel: PriceRuleChannel.ERP,
      ...defaultContext,
    })
    setResult(null)
    setError(null)
  }, [defaultContext])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Formulaire de simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Simulateur de prix
          </CardTitle>
          <CardDescription>
            Testez l'application des règles de prix sur vos articles
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="article">Article *</Label>
              <Select
                value={context.articleId || ''}
                onValueChange={(value) => updateContext('articleId', value)}
              >
                <SelectTrigger id="article">
                  <SelectValue placeholder="Sélectionnez un article" />
                </SelectTrigger>
                <SelectContent>
                  {availableArticles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {article.reference} - {article.designation}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {formatPrice(article.prixVenteHT)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={context.quantity}
                onChange={(e) => updateContext('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="channel">Canal de vente</Label>
              <Select
                value={context.channel}
                onValueChange={(value) => updateContext('channel', value as PriceRuleChannel)}
              >
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PriceRuleChannel.ERP}>ERP</SelectItem>
                  <SelectItem value={PriceRuleChannel.MARKETPLACE}>Marketplace</SelectItem>
                  <SelectItem value={PriceRuleChannel.B2B}>B2B</SelectItem>
                  <SelectItem value={PriceRuleChannel.API}>API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customerGroup">Groupe client</Label>
              <Select
                value={context.customerGroup || ''}
                onValueChange={(value) => updateContext('customerGroup', value || undefined)}
              >
                <SelectTrigger id="customerGroup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_GROUPS.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options avancées */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-3"
            >
              {showAdvanced ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Options avancées
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="customerId">ID Client</Label>
                  <Input
                    id="customerId"
                    value={context.customerId || ''}
                    onChange={(e) => updateContext('customerId', e.target.value || undefined)}
                    placeholder="UUID du client"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email client</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={context.customerEmail || ''}
                    onChange={(e) => updateContext('customerEmail', e.target.value || undefined)}
                    placeholder="client@example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Article sélectionné */}
          {selectedArticle && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>Article sélectionné</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Référence</span>
                    <p className="font-medium">{selectedArticle.reference}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Famille</span>
                    <p className="font-medium">{selectedArticle.famille || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Prix de base</span>
                    <p className="font-medium">{formatPrice(selectedArticle.prixVenteHT)}</p>
                  </div>
                  {selectedArticle.poids && (
                    <div>
                      <span className="text-xs text-muted-foreground">Poids</span>
                      <p className="font-medium">{selectedArticle.poids} kg</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>

            <Button onClick={handleSimulate} disabled={loading || !context.articleId}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Simulation...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Simuler
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Résultat de la simulation
              </CardTitle>

              <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <span className="text-sm text-muted-foreground">Prix de base</span>
                <p className="text-2xl font-bold">{formatPrice(result.basePrice)}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Prix final</span>
                <p className="text-2xl font-bold text-primary">{formatPrice(result.finalPrice)}</p>
                {result.unitPrice && (
                  <p className="text-sm text-muted-foreground">
                    soit {formatPrice(result.unitPrice.value)}/{result.unitPrice.unit}
                  </p>
                )}
              </div>

              <div>
                <span className="text-sm text-muted-foreground">
                  {result.totalDiscount < 0 ? 'Remise totale' : 'Majoration totale'}
                </span>
                <p className="text-2xl font-bold">
                  {result.totalDiscount < 0 ? (
                    <span className="text-green-600">
                      {formatPrice(Math.abs(result.totalDiscount))}
                    </span>
                  ) : (
                    <span className="text-orange-600">+{formatPrice(result.totalDiscount)}</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPercentage(result.totalDiscountPercentage)}
                </p>
              </div>
            </div>

            {context.quantity > 1 && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Prix total pour {context.quantity} unités
                  </span>
                  <span className="text-xl font-bold">
                    {formatPrice(result.finalPrice * context.quantity)}
                  </span>
                </div>
              </div>
            )}

            {showDetails && (
              <>
                <Separator className="my-6" />

                {/* Règles appliquées */}
                {result.appliedRules.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Règles appliquées ({result.appliedRules.length})
                    </h4>

                    <div className="space-y-2">
                      {result.appliedRules.map((rule, index) => (
                        <div
                          key={rule.ruleId}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{rule.ruleName}</p>
                              <p className="text-sm text-muted-foreground">Type: {rule.ruleType}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-medium">
                              {rule.discountAmount < 0 ? (
                                <span className="text-green-600">
                                  -{formatPrice(Math.abs(rule.discountAmount))}
                                </span>
                              ) : (
                                <span className="text-orange-600">
                                  +{formatPrice(rule.discountAmount)}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPercentage(rule.discountPercentage)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Règles non appliquées */}
                {result.skippedRules && result.skippedRules.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
                      <Info className="w-4 h-4" />
                      Règles non appliquées ({result.skippedRules.length})
                    </h4>

                    <div className="space-y-2">
                      {result.skippedRules.map((rule) => (
                        <div
                          key={rule.ruleId}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/10 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-muted-foreground">{rule.ruleName}</p>
                            <p className="text-sm text-muted-foreground">Raison: {rule.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avertissements */}
                {result.warnings && result.warnings.length > 0 && (
                  <Alert className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Avertissements</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Règles disponibles */}
      {availableRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Règles disponibles
            </CardTitle>
            <CardDescription>
              {availableRules.length} règles peuvent potentiellement s'appliquer
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {availableRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{rule.channel}</Badge>
                    <div>
                      <p className="font-medium">{rule.ruleName}</p>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rule.priority > 0 && (
                      <Badge variant="secondary">Priorité: {rule.priority}</Badge>
                    )}
                    {!rule.combinable && <Badge variant="destructive">Non combinable</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
