'use client'
import {
  AlertTriangle,
  DollarSign,
  Percent,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Badge, Progress } from '../../../primitives'
export interface ProfitabilityData {
  period: string
  revenue: number
  costs: {
    materials: number
    labor: number
    overhead: number
    other: number
    total: number
  }
  grossProfit: number
  grossMargin: number // percentage
  netProfit: number
  netMargin: number // percentage
  ebitda: number
  ebitdaMargin: number // percentage
  roi: number // Return on Investment percentage
  breakEvenPoint: number
  contributionMargin: number
  segments: Array<{
    name: string
    revenue: number
    profit: number
    margin: number
    growth: number
    contribution: number // percentage of total profit
  }>
  products: Array<{
    reference: string
    name: string
    revenue: number
    cost: number
    profit: number
    margin: number
    volume: number
  }>
  customers: Array<{
    name: string
    revenue: number
    profit: number
    margin: number
    ltv: number // Lifetime Value
  }>
  kpis?: {
    cashFlow: number
    workingCapital: number
    dso: number // Days Sales Outstanding
    dpo: number // Days Payable Outstanding
    cashConversionCycle: number
  }
}
interface ProfitabilityChartProps {
  data?: ProfitabilityData[]
  title?: string
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  showSegments?: boolean
  showProducts?: boolean
  showKpis?: boolean
  height?: number
  className?: string
  loading?: boolean
  onPeriodChange?: (period: string) => void
  onSegmentClick?: (segment: string) => void
  onViewDetails?: () => void
}
export function ProfitabilityChart({
  data = [],
  title = 'Graphique de rentabilité',
  period = 'monthly',
  showSegments = true,
  showProducts = true,
  showKpis = true,
  height = 400,
  className,
  loading = false,
  onPeriodChange,
  onSegmentClick,
  onViewDetails,
}: ProfitabilityChartProps) {
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
              <p className="mt-2 text-sm text-muted-foreground">
                Chargement des données de rentabilité...
              </p>
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  const getMarginColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600'
    if (margin >= 10) return 'text-yellow-600'
    if (margin >= 0) return 'text-orange-600'
    return 'text-red-600'
  }
  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null
    return current >= previous ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }
  // Cost breakdown pie chart simulation
  const renderCostBreakdown = () => {
    if (!currentData?.costs) return null
    const { materials, labor, overhead, other } = currentData.costs
    const total = materials + labor + overhead + other
    const segments = [
      { name: 'Matériaux', value: materials, color: 'bg-blue-500' },
      { name: 'Main dœuvre', value: labor, color: 'bg-green-500' },
      { name: 'Frais généraux', value: overhead, color: 'bg-yellow-500' },
      { name: 'Autres', value: other, color: 'bg-purple-500' },
    ]
    return (
      <div className="space-y-2">
        {segments.map((segment) => {
          const percentage = (segment.value / total) * 100
          return (
            <div key={segment.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{segment.name}</span>
                <span className="font-medium">
                  {formatCurrency(segment.value)} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </div>
    )
  }
  // Margin evolution chart
  const renderMarginTrend = () => {
    const maxMargin = Math.max(...data.map((d) => d.grossMargin))
    return (
      <div className="flex items-end justify-between gap-1 h-24">
        {data.slice(0, 12).map((item, index) => {
          const height = (item.grossMargin / maxMargin) * 100
          const _color = getMarginColor(item.grossMargin)
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-blue-500 to-green-500 rounded-t opacity-70 hover:opacity-100 transition-all cursor-pointer relative group"
              style={{ height: `${height}%` }}
              role={onPeriodChange ? 'button' : undefined}
              tabIndex={onPeriodChange ? 0 : undefined}
              onClick={() => onPeriodChange?.(item.period)}
              onKeyDown={(e) => {
                if (onPeriodChange && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onPeriodChange(item.period)
                }
              }}
            >
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.period}: {formatPercent(item.grossMargin)}
              </div>
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
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => onPeriodChange?.('monthly')}
          >
            Mois
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => onPeriodChange?.('quarterly')}
          >
            Trimestre
          </Badge>
          <Badge
            variant={period === 'yearly' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onPeriodChange?.('yearly')}
          >
            Année
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">Aucune donnée de rentabilité disponible</p>
          </div>
        ) : currentData ? (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Chiffre d'affaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(currentData.revenue)}</span>
                  {getTrendIcon(currentData.revenue, previousData?.revenue)}
                </div>
                {previousData && (
                  <div className="text-xs text-muted-foreground">
                    vs {formatCurrency(previousData.revenue)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span>Marge brute</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getMarginColor(currentData.grossMargin)}`}>
                    {formatPercent(currentData.grossMargin)}
                  </span>
                  {getTrendIcon(currentData.grossMargin, previousData?.grossMargin)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(currentData.grossProfit)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Marge nette</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getMarginColor(currentData.netMargin)}`}>
                    {formatPercent(currentData.netMargin)}
                  </span>
                  {getTrendIcon(currentData.netMargin, previousData?.netMargin)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(currentData.netProfit)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PieChart className="h-4 w-4" />
                  <span>EBITDA</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(currentData.ebitda)}</div>
                <div className="text-xs text-muted-foreground">
                  Marge: {formatPercent(currentData.ebitdaMargin)}
                </div>
              </div>
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Cost Breakdown */}
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Répartition des coûts</div>
                {renderCostBreakdown()}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total des coûts</span>
                    <span className="font-bold">{formatCurrency(currentData.costs.total)}</span>
                  </div>
                </div>
              </div>
              {/* Margin Trend */}
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Évolution de la marge brute</div>
                {renderMarginTrend()}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {data.slice(0, 12).map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                      {index % 3 === 0 ? item.period.slice(-2) : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Segments Performance */}
            {showSegments && currentData.segments && currentData.segments.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3">Performance par segment</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Segment</th>
                        <th className="text-right py-2">CA</th>
                        <th className="text-right py-2">Bénéfice</th>
                        <th className="text-right py-2">Marge</th>
                        <th className="text-right py-2">Croissance</th>
                        <th className="text-right py-2">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.segments.map((segment, index) => (
                        <tr
                          key={index}
                          className="border-b cursor-pointer hover:bg-gray-50"
                          onClick={() => onSegmentClick?.(segment.name)}
                        >
                          <td className="py-2 font-medium">{segment.name}</td>
                          <td className="py-2 text-right">{formatCurrency(segment.revenue)}</td>
                          <td className="py-2 text-right">{formatCurrency(segment.profit)}</td>
                          <td
                            className={`py-2 text-right font-medium ${getMarginColor(segment.margin)}`}
                          >
                            {formatPercent(segment.margin)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={segment.growth >= 0 ? 'text-green-600' : 'text-red-600'}
                            >
                              {segment.growth >= 0 ? '+' : ''}
                              {formatPercent(segment.growth)}
                            </span>
                          </td>
                          <td className="py-2 text-right">{formatPercent(segment.contribution)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Top Products */}
            {showProducts && currentData.products && currentData.products.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3">Produits les plus rentables</div>
                <div className="space-y-2">
                  {currentData.products.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium text-sm">{product.reference}</div>
                        <div className="text-xs text-muted-foreground">{product.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(product.profit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Volume: {product.volume}
                          </div>
                        </div>
                        <Badge
                          className={getMarginColor(product.margin)
                            .replace('text-', 'bg-')
                            .replace('600', '100')}
                        >
                          {formatPercent(product.margin)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* KPIs */}
            {showKpis && currentData.kpis && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Cash Flow</div>
                  <div className="font-medium">{formatCurrency(currentData.kpis.cashFlow)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">BFR</div>
                  <div className="font-medium">
                    {formatCurrency(currentData.kpis.workingCapital)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">DSO</div>
                  <div className="font-medium">{currentData.kpis.dso} jours</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">DPO</div>
                  <div className="font-medium">{currentData.kpis.dpo} jours</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cycle de conversion</div>
                  <div className="font-medium">{currentData.kpis.cashConversionCycle} jours</div>
                </div>
              </div>
            )}
            {/* Alerts */}
            {currentData.netMargin < 5 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">Attention: Marge nette faible</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  La marge nette de {formatPercent(currentData.netMargin)} est en dessous du seuil
                  recommandé de 5%.
                </p>
              </div>
            )}
            {onViewDetails && (
              <div className="mt-4 flex justify-center">
                <button onClick={onViewDetails} className="text-sm text-blue-600 hover:underline">
                  Voir l'analyse financière complète →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
