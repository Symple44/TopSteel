'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Badge } from '../../../primitives'
import { Progress } from '../../../primitives'
import { Factory, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Wrench, Package } from 'lucide-react'
export interface ProductionData {
  period: string
  totalProduced: number
  totalPlanned: number
  efficiency: number // percentage
  quality: number // percentage
  oee: number // Overall Equipment Effectiveness percentage
  machines: Array<{
    id: string
    name: string
    status: 'running' | 'idle' | 'maintenance' | 'broken'
    produced: number
    target: number
    efficiency: number
    downtime: number // minutes
  }>
  products: Array<{
    reference: string
    name: string
    planned: number
    produced: number
    defects: number
    completionRate: number
  }>
  shifts: Array<{
    name: string
    start: string
    end: string
    produced: number
    workers: number
  }>
  issues?: Array<{
    type: 'breakdown' | 'quality' | 'material' | 'labor'
    description: string
    impact: 'low' | 'medium' | 'high'
    timestamp: Date
  }>
  metrics?: {
    cycleTime: number // average in minutes
    setupTime: number // average in minutes
    scrapRate: number // percentage
    firstPassYield: number // percentage
  }
}
interface ProductionChartProps {
  data?: ProductionData[]
  title?: string
  period?: 'hourly' | 'shift' | 'daily' | 'weekly' | 'monthly'
  showMachines?: boolean
  showProducts?: boolean
  showMetrics?: boolean
  height?: number
  className?: string
  loading?: boolean
  onPeriodChange?: (period: string) => void
  onMachineClick?: (machineId: string) => void
  onViewDetails?: () => void
}
export function ProductionChart({ 
  data = [],
  title = "Graphique de production",
  period = 'daily',
  showMachines = true,
  showProducts = true,
  showMetrics = true,
  height = 400,
  className,
  loading = false,
  onPeriodChange,
  onMachineClick,
  onViewDetails
}: ProductionChartProps) {
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
              <p className="mt-2 text-sm text-muted-foreground">Chargement des données de production...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  const currentData = data[0]
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }
  const getStatusBadge = (status: string) => {
    const variants = {
      running: { label: 'En production', className: 'bg-green-100 text-green-800' },
      idle: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      maintenance: { label: 'Maintenance', className: 'bg-blue-100 text-blue-800' },
      broken: { label: 'En panne', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[status as keyof typeof variants] || variants.idle
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getImpactBadge = (impact: string) => {
    const variants = {
      low: { className: 'bg-gray-100 text-gray-800' },
      medium: { className: 'bg-orange-100 text-orange-800' },
      high: { className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[impact as keyof typeof variants] || variants.low
    return <Badge className={variant.className}>{impact}</Badge>
  }
  // Simulated production bars
  const renderProductionBars = () => {
    const maxProduction = Math.max(...data.map(d => d.totalProduced))
    return (
      <div className="flex items-end justify-between gap-2 h-32 mt-4">
        {data.slice(0, 24).map((item, index) => {
          const height = (item.totalProduced / maxProduction) * 100
          const efficiencyColor = item.efficiency >= 90 ? 'bg-green-500' : item.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          return (
            <div 
              key={index}
              className={`flex-1 ${efficiencyColor} hover:opacity-80 rounded-t transition-all cursor-pointer relative group`}
              style={{ height: `${height}%` }}
              onClick={() => onPeriodChange?.(item.period)}
            >
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.period}: {formatNumber(item.totalProduced)} unités
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
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('hourly')}>
            Heure
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('shift')}>
            Équipe
          </Badge>
          <Badge variant={period === 'daily' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => onPeriodChange?.('daily')}>
            Jour
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => onPeriodChange?.('weekly')}>
            Semaine
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">Aucune donnée de production disponible</p>
          </div>
        ) : currentData ? (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Production</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(currentData.totalProduced)}
                </div>
                <div className="text-xs text-muted-foreground">
                  / {formatNumber(currentData.totalPlanned)} planifié
                </div>
                <Progress value={(currentData.totalProduced / currentData.totalPlanned) * 100} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Efficacité</span>
                </div>
                <div className={`text-2xl font-bold ${getEfficiencyColor(currentData.efficiency)}`}>
                  {currentData.efficiency}%
                </div>
                <Progress value={currentData.efficiency} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Qualité</span>
                </div>
                <div className={`text-2xl font-bold ${getEfficiencyColor(currentData.quality)}`}>
                  {currentData.quality}%
                </div>
                <Progress value={currentData.quality} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Factory className="h-4 w-4" />
                  <span>TRG (OEE)</span>
                </div>
                <div className={`text-2xl font-bold ${getEfficiencyColor(currentData.oee)}`}>
                  {currentData.oee}%
                </div>
                <Progress value={currentData.oee} className="h-1" />
              </div>
              {showMetrics && currentData.metrics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Temps cycle</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {currentData.metrics.cycleTime}min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Setup: {currentData.metrics.setupTime}min
                  </div>
                </div>
              )}
            </div>
            {/* Production Chart */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="text-sm font-medium mb-2">Production sur la période</div>
              {renderProductionBars()}
            </div>
            {/* Machines Status */}
            {showMachines && currentData.machines && currentData.machines.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3">État des machines</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentData.machines.map((machine) => (
                    <div 
                      key={machine.id}
                      className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onMachineClick?.(machine.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {machine.produced}/{machine.target} unités
                          </div>
                        </div>
                        {getStatusBadge(machine.status)}
                      </div>
                      <Progress value={machine.efficiency} className="h-2 mb-1" />
                      <div className="flex justify-between text-xs">
                        <span className={getEfficiencyColor(machine.efficiency)}>
                          Efficacité: {machine.efficiency}%
                        </span>
                        {machine.downtime > 0 && (
                          <span className="text-red-600">
                            Arrêt: {machine.downtime}min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Products Performance */}
            {showProducts && currentData.products && currentData.products.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-3">Performance par produit</div>
                <div className="space-y-2">
                  {currentData.products.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.reference}</div>
                        <div className="text-xs text-muted-foreground">{product.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {product.produced}/{product.planned}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Complétion: {product.completionRate}%
                          </div>
                        </div>
                        {product.defects > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {product.defects} défauts
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Issues */}
            {currentData.issues && currentData.issues.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Problèmes signalés
                </div>
                <div className="space-y-2">
                  {currentData.issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded">
                      <div>
                        <Badge variant="outline" className="mr-2">{issue.type}</Badge>
                        <span className="text-muted-foreground">{issue.description}</span>
                      </div>
                      {getImpactBadge(issue.impact)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {onViewDetails && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onViewDetails}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir le rapport complet →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
