'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Badge } from '../../../primitives'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react'
export interface SalesData {
  period: string // e.g., "2024-01", "Q1 2024", "Week 42"
  revenue: number
  orders: number
  averageOrderValue: number
  customers: number
  products: number
  growth: number // percentage vs previous period
  comparison?: {
    previousPeriod: string
    previousRevenue: number
    previousOrders: number
  }
  topProducts?: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  topCustomers?: Array<{
    name: string
    orders: number
    revenue: number
  }>
  breakdown?: {
    byCategory?: Record<string, number>
    byRegion?: Record<string, number>
    byChannel?: Record<string, number>
  }
}
interface SalesChartProps {
  data?: SalesData[]
  title?: string
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  showComparison?: boolean
  showBreakdown?: boolean
  height?: number
  className?: string
  loading?: boolean
  onPeriodChange?: (period: string) => void
  onViewDetails?: () => void
}
export function SalesChart({ 
  data = [],
  title = "Graphique des ventes",
  period = 'monthly',
  showComparison = true,
  showBreakdown = false,
  height = 400,
  className,
  loading = false,
  onPeriodChange,
  onViewDetails
}: SalesChartProps) {
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
              <p className="mt-2 text-sm text-muted-foreground">Chargement des données de ventes...</p>
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
  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />
  }
  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }
  // Simulated chart bars for visualization
  const renderBars = () => {
    const maxRevenue = Math.max(...data.map(d => d.revenue))
    return (
      <div className="flex items-end justify-between gap-2 h-48 mt-4">
        {data.slice(0, 12).map((item, index) => {
          const height = (item.revenue / maxRevenue) * 100
          return (
            <div 
              key={index}
              className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t transition-all cursor-pointer relative group"
              style={{ height: `${height}%` }}
              onClick={() => onPeriodChange?.(item.period)}
            >
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.period}: {formatCurrency(item.revenue)}
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
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('daily')}>
            Jour
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('weekly')}>
            Semaine
          </Badge>
          <Badge variant={period === 'monthly' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => onPeriodChange?.('monthly')}>
            Mois
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('yearly')}>
            Année
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">Aucune donnée de vente disponible</p>
          </div>
        ) : (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Chiffre d'affaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {formatCurrency(currentData?.revenue || 0)}
                  </span>
                  {currentData?.growth !== undefined && (
                    <div className={`flex items-center gap-1 ${getGrowthColor(currentData.growth)}`}>
                      {getGrowthIcon(currentData.growth)}
                      <span className="text-sm font-medium">{Math.abs(currentData.growth)}%</span>
                    </div>
                  )}
                </div>
                {showComparison && previousData && (
                  <div className="text-xs text-muted-foreground">
                    vs {formatCurrency(previousData.revenue)} précédent
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Commandes</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(currentData?.orders || 0)}
                </div>
                {currentData?.averageOrderValue && (
                  <div className="text-xs text-muted-foreground">
                    Panier moyen: {formatCurrency(currentData.averageOrderValue)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(currentData?.customers || 0)}
                </div>
                {showComparison && previousData && (
                  <div className="text-xs text-muted-foreground">
                    {previousData.customers > currentData.customers ? '-' : '+'}
                    {Math.abs(currentData.customers - previousData.customers)} vs précédent
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Produits vendus</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(currentData?.products || 0)}
                </div>
              </div>
            </div>
            {/* Chart */}
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Evolution sur la période</div>
              {renderBars()}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                {data.slice(0, 12).map((item, index) => (
                  <div key={index} className="flex-1 text-center">
                    {item.period.split('-')[1] || item.period.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>
            {/* Top Products & Customers */}
            {showBreakdown && currentData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {currentData.topProducts && currentData.topProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top produits</div>
                    {currentData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{product.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{product.quantity} unités</Badge>
                          <span className="font-medium">{formatCurrency(product.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {currentData.topCustomers && currentData.topCustomers.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top clients</div>
                    {currentData.topCustomers.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{customer.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{customer.orders} cmd</Badge>
                          <span className="font-medium">{formatCurrency(customer.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {onViewDetails && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onViewDetails}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir les détails complets →
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
