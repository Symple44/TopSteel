'use client'

// ✅ COMPOSANT COMPATIBLE AVEC VOS VERSIONS RÉCENTES
// Compatible avec react ^19.1.0, recharts ^3.0.2, lucide-react ^0.525.0

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { MouvementStats } from '@/types/stock'
import { useState, useMemo, useTransition } from 'react'
import { cn } from '@/lib/utils'

// Compatible avec recharts ^3.0.2
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts'

interface MouvementsChartProps {
  data: MouvementStats[]
  period: string
  onPeriodChange: (period: string) => void
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  className?: string
}

/**
 * ✅ COMPOSANT MODERNE COMPATIBLE AVEC VOS VERSIONS
 * 
 * Fonctionnalités compatibles:
 * - React 19.1.0 (useTransition, concurrent features)
 * - Recharts 3.0.2 (graphiques interactifs)
 * - Lucide React 0.525.0 (icônes modernes)
 * - TanStack Query 5.81.5 (cache et mutations)
 * - Next.js 15.3.4 (optimisations)
 */
export function MouvementsChart({ 
  data, 
  period, 
  onPeriodChange,
  loading = false,
  onRefresh,
  onExport,
  className
}: MouvementsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [isPending, startTransition] = useTransition()

  // Calculs optimisés avec React 19
  const stats = useMemo(() => {
    const totals = data.reduce((acc, item) => ({
      entrees: acc.entrees + item.entrees,
      sorties: acc.sorties + item.sorties,
      transferts: acc.transferts + item.transferts,
      valeurEntrees: acc.valeurEntrees + item.valeurEntrees,
      valeurSorties: acc.valeurSorties + item.valeurSorties,
    }), {
      entrees: 0,
      sorties: 0,
      transferts: 0,
      valeurEntrees: 0,
      valeurSorties: 0,
    })

    const solde = totals.valeurEntrees - totals.valeurSorties
    const mouvementsTotal = totals.entrees + totals.sorties + totals.transferts
    
    // Tendances
    const lastTwoMonths = data.slice(-2)
    const trend = lastTwoMonths.length === 2 ? 
      lastTwoMonths[1].valeurEntrees - lastTwoMonths[0].valeurEntrees : 0

    return {
      ...totals,
      solde,
      mouvementsTotal,
      trend,
      tendancePositive: trend >= 0
    }
  }, [data])

  // Données formatées pour recharts
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      solde: item.valeurEntrees - item.valeurSorties,
      entreesPct: item.entrees > 0 ? (item.entrees / (item.entrees + item.sorties)) * 100 : 0
    }))
  }, [data])

  const handlePeriodChange = (newPeriod: string) => {
    startTransition(() => {
      onPeriodChange(newPeriod)
    })
  }

  const handleChartTypeChange = (newType: 'line' | 'bar') => {
    startTransition(() => {
      setChartType(newType)
    })
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution des mouvements
              {isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data.length} périodes • {stats.mouvementsTotal.toLocaleString()} mouvements
              {stats.trend !== 0 && (
                <span className={\ml-2 inline-flex items-center gap-1 \$\{stats.tendancePositive ? 'text-green-600' : 'text-red-600'\}\}>
                  {stats.tendancePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stats.trend).toLocaleString()}€
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value: 'line' | 'bar') => handleChartTypeChange(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Ligne</SelectItem>
                <SelectItem value="bar">Barres</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="3m">3 mois</SelectItem>
                <SelectItem value="6m">6 mois</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
                <SelectItem value="2y">2 ans</SelectItem>
              </SelectContent>
            </Select>

            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefresh}
                disabled={loading || isPending}
              >
                <RefreshCw className={\h-4 w-4 \$\{loading ? 'animate-spin' : ''\}\} />
              </Button>
            )}

            {onExport && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onExport}
                disabled={loading || isPending}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Métriques résumées avec design moderne */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">ENTRÉES</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.entrees.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              {stats.valeurEntrees.toLocaleString()}€
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">SORTIES</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {stats.sorties.toLocaleString()}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 mt-1">
              {stats.valeurSorties.toLocaleString()}€
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">TRANSFERTS</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.transferts.toLocaleString()}
            </div>
          </div>

          <div className={\g-gradient-to-br p-4 rounded-xl border \$\{
            stats.solde >= 0 
              ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800' 
              : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'
          \}\}>
            <div className="flex items-center justify-between mb-2">
              {stats.tendancePositive ? 
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> :
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              }
              <span className={\	ext-xs font-medium \$\{
                stats.solde >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-orange-600 dark:text-orange-400'
              \}\}>
                SOLDE
              </span>
            </div>
            <div className={\	ext-2xl font-bold \$\{
              stats.solde >= 0 
                ? 'text-emerald-700 dark:text-emerald-300' 
                : 'text-orange-700 dark:text-orange-300'
            \}\}>
              {stats.solde > 0 ? '+' : ''}{stats.solde.toLocaleString()}€
            </div>
          </div>
        </div>

        {/* Graphique avec Recharts 3.0.2 */}
        <div className="h-96 mb-6">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Chargement des données...
              </div>
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                  <Line 
                    type="monotone" 
                    dataKey="entrees" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', r: 4 }}
                    name="Entrées"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sorties" 
                    stroke="#dc2626" 
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', r: 4 }}
                    name="Sorties"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transferts" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 4 }}
                    name="Transferts"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="solde" 
                    stroke="#7c3aed" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#7c3aed', r: 3 }}
                    name="Solde"
                    connectNulls={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="entrees" fill="#16a34a" name="Entrées" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sorties" fill="#dc2626" name="Sorties" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="transferts" fill="#2563eb" name="Transferts" radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée disponible pour la période sélectionnée</p>
              </div>
            </div>
          )}
        </div>

        {/* Table détaillée responsive */}
        {data.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              📊 Données détaillées ({data.length} éléments)
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Période</th>
                    <th className="text-right py-3 px-2 font-medium text-green-600">Entrées</th>
                    <th className="text-right py-3 px-2 font-medium text-red-600">Sorties</th>
                    <th className="text-right py-3 px-2 font-medium text-blue-600">Transferts</th>
                    <th className="text-right py-3 px-2 font-medium">Val. Entrées</th>
                    <th className="text-right py-3 px-2 font-medium">Val. Sorties</th>
                    <th className="text-right py-3 px-2 font-medium">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => {
                    const solde = item.valeurEntrees - item.valeurSorties
                    return (
                      <tr key={item.date} className={cn(
                        "transition-colors hover:bg-muted/50",
                        index % 2 === 0 ? 'bg-muted/20' : ''
                      )}>
                        <td className="py-2 px-2 font-medium">{item.name}</td>
                        <td className="text-right py-2 px-2 text-green-600 font-mono">
                          {item.entrees.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-2 text-red-600 font-mono">
                          {item.sorties.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-2 text-blue-600 font-mono">
                          {item.transferts.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-2 font-mono">
                          {item.valeurEntrees.toLocaleString()}€
                        </td>
                        <td className="text-right py-2 px-2 font-mono">
                          {item.valeurSorties.toLocaleString()}€
                        </td>
                        <td className={\	ext-right py-2 px-2 font-mono font-medium \$\{
                          solde >= 0 ? 'text-green-600' : 'text-red-600'
                        \}\}>
                          {solde > 0 ? '+' : ''}{solde.toLocaleString()}€
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

// ✅ Export avec types pour compatibility
export type { MouvementsChartProps }
export default MouvementsChart
