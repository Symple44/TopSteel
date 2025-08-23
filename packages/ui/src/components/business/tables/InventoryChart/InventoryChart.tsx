'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Badge } from '../../../primitives'
import { Progress } from '../../../primitives'
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3, Clock } from 'lucide-react'
export interface InventoryData {
  period: string
  totalValue: number
  totalItems: number
  totalQuantity: number
  categories: Array<{
    name: string
    value: number
    quantity: number
    percentage: number
  }>
  stockLevels: {
    optimal: number
    overstock: number
    lowStock: number
    outOfStock: number
  }
  movements: {
    entries: number
    exits: number
    adjustments: number
    transfers: number
  }
  turnover: {
    rate: number // times per period
    days: number // days of inventory
    trend: 'improving' | 'stable' | 'declining'
  }
  topItems: Array<{
    reference: string
    name: string
    quantity: number
    value: number
    turnoverRate: number
  }>
  alerts?: Array<{
    type: 'stockout' | 'overstock' | 'expiry' | 'reorder'
    itemReference: string
    itemName: string
    message: string
    urgency: 'low' | 'medium' | 'high'
  }>
  costBreakdown?: {
    purchaseCost: number
    holdingCost: number
    obsolescenceCost: number
    shortageCost: number
  }
}
interface InventoryChartProps {
  data?: InventoryData[]
  title?: string
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  showCategories?: boolean
  showMovements?: boolean
  showAlerts?: boolean
  showCosts?: boolean
  height?: number
  className?: string
  loading?: boolean
  onPeriodChange?: (period: string) => void
  onCategoryClick?: (category: string) => void
  onViewDetails?: () => void
}
export function InventoryChart({ 
  data = [],
  title = "Graphique d'inventaire",
  period = 'monthly',
  showCategories = true,
  showMovements = true,
  showAlerts = true,
  showCosts = false,
  height = 400,
  className,
  loading = false,
  onPeriodChange,
  onCategoryClick,
  onViewDetails
}: InventoryChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">Chargement des données d'inventaire...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  const currentData = data[0]
  const previousData = data[1]
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }
  const getStockLevelColor = (level: string) => {
    const colors = {
      optimal: 'bg-green-500',
      overstock: 'bg-blue-500',
      lowStock: 'bg-yellow-500',
      outOfStock: 'bg-red-500',
    }
    return colors[level as keyof typeof colors] || 'bg-gray-500'
  }
  const getTurnoverTrend = (trend?: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <span className="text-muted-foreground">-</span>
  }
  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      low: { className: 'bg-gray-100 text-gray-800' },
      medium: { className: 'bg-orange-100 text-orange-800' },
      high: { className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[urgency as keyof typeof variants] || variants.low
    return <Badge className={variant.className}>{urgency}</Badge>
  }
  // Stock levels visualization
  const renderStockLevels = () => {
    if (!currentData?.stockLevels) return null
    const total = Object.values(currentData.stockLevels).reduce((a, b) => a + b, 0)
    return (
      <div className="space-y-2">
        {Object.entries(currentData.stockLevels).map(([level, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          const labels = {
            optimal: 'Stock optimal',
            overstock: 'Surstock',
            lowStock: 'Stock faible',
            outOfStock: 'Rupture',
          }
          return (
            <div key={level} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labels[level as keyof typeof labels]}</span>
                <span className="font-medium">{count} articles ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('daily')}>
            Jour
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('weekly')}>
            Semaine
          </Badge>
          <Badge variant={period === 'monthly' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => onPeriodChange?.('monthly')}>
            Mois
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('quarterly')}>
            Trimestre
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">Aucune donnée d'inventaire disponible</p>
          </div>
        ) : currentData ? (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Valeur totale</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(currentData.totalValue)}
                </div>
                {previousData && (
                  <div className="text-xs text-muted-foreground">
                    vs {formatCurrency(previousData.totalValue)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Articles</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(currentData.totalItems)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Qté totale: {formatNumber(currentData.totalQuantity)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Rotation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {currentData.turnover.rate.toFixed(1)}x
                  </span>
                  {getTurnoverTrend(currentData.turnover.trend)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentData.turnover.days} jours de stock
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Mouvements</span>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">↑ {currentData.movements.entries}</span>
                    <span className="text-red-600">↓ {currentData.movements.exits}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ajust: {currentData.movements.adjustments} | Transf: {currentData.movements.transfers}
                  </div>
                </div>
              </div>
            </div>
            {/* Stock Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Niveaux de stock</div>
                {renderStockLevels()}
              </div>
              {/* Categories Distribution */}
              {showCategories && currentData.categories && currentData.categories.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-3">Répartition par catégorie</div>
                  <div className="space-y-2">
                    {currentData.categories.slice(0, 5).map((category) => (
                      <div 
                        key={category.name}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={() => onCategoryClick?.(category.name)}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `hsl(${category.percentage * 3.6}, 70%, 50%)` }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(category.value)}</div>
                          <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Top Items */}
            {currentData.topItems && currentData.topItems.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3">Top articles par valeur</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Référence</th>
                        <th className="text-left py-2">Désignation</th>
                        <th className="text-right py-2">Quantité</th>
                        <th className="text-right py-2">Valeur</th>
                        <th className="text-right py-2">Rotation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.topItems.slice(0, 5).map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium">{item.reference}</td>
                          <td className="py-2 text-muted-foreground">{item.name}</td>
                          <td className="py-2 text-right">{formatNumber(item.quantity)}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(item.value)}</td>
                          <td className="py-2 text-right">{item.turnoverRate.toFixed(1)}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Alerts */}
            {showAlerts && currentData.alerts && currentData.alerts.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Alertes inventaire
                </div>
                <div className="space-y-2">
                  {currentData.alerts.slice(0, 5).map((alert, index) => {
                    const icons = {
                      stockout: '🚨',
                      overstock: '📦',
                      expiry: '⏰',
                      reorder: '🔄',
                    }
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                        <div className="flex items-center gap-2">
                          <span>{icons[alert.type as keyof typeof icons]}</span>
                          <div>
                            <span className="font-medium text-sm">{alert.itemReference}</span>
                            <span className="text-sm text-muted-foreground ml-2">{alert.message}</span>
                          </div>
                        </div>
                        {getUrgencyBadge(alert.urgency)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Cost Breakdown */}
            {showCosts && currentData.costBreakdown && (
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Répartition des coûts</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Coût d'achat</div>
                    <div className="font-medium">{formatCurrency(currentData.costBreakdown.purchaseCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Coût de stockage</div>
                    <div className="font-medium">{formatCurrency(currentData.costBreakdown.holdingCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Coût d'obsolescence</div>
                    <div className="font-medium">{formatCurrency(currentData.costBreakdown.obsolescenceCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Coût de rupture</div>
                    <div className="font-medium">{formatCurrency(currentData.costBreakdown.shortageCost)}</div>
                  </div>
                </div>
              </div>
            )}
            {onViewDetails && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onViewDetails}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir l'analyse complète →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
