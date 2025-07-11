// apps/web/src/components/stocks/mouvements-chart.tsx
'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'

import { Activity, BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface MouvementStats {
  date: string
  entrees: number
  sorties: number
  transferts: number
  valeurEntrees: number
  valeurSorties: number
}

interface MouvementsChartProps {
  data: MouvementStats[]
  period: 'week' | 'month' | 'quarter'
  onPeriodChange: (period: 'week' | 'month' | 'quarter') => void
}

export function MouvementsChart({ data, period, onPeriodChange }: MouvementsChartProps) {
  const [activeTab, setActiveTab] = useState<'volume' | 'value'>('volume')

  // Calculs de statistiques
  const totalEntrees = data.reduce((sum, item) => sum + item.entrees, 0)
  const totalSorties = data.reduce((sum, item) => sum + item.sorties, 0)
  const totalValeurEntrees = data.reduce((sum, item) => sum + item.valeurEntrees, 0)
  const totalValeurSorties = data.reduce((sum, item) => sum + item.valeurSorties, 0)

  const maxVolume = Math.max(...data.map((item) => Math.max(item.entrees, item.sorties)))
  const maxValue = Math.max(...data.map((item) => Math.max(item.valeurEntrees, item.valeurSorties)))

  const getBarHeight = (value: number, max: number) => {
    return Math.max(2, (value / max) * 200) // Hauteur min 2px, max 200px
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'volume' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('volume')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Volume
          </Button>
          <Button
            variant={activeTab === 'value' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('value')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Valeur
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('week')}
          >
            Semaine
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('month')}
          >
            Mois
          </Button>
          <Button
            variant={period === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('quarter')}
          >
            Trimestre
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entrées</p>
                <p className="text-xl font-bold">{totalEntrees}</p>
                <p className="text-xs text-green-600">{totalValeurEntrees.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sorties</p>
                <p className="text-xl font-bold">{totalSorties}</p>
                <p className="text-xs text-red-600">{totalValeurSorties.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde</p>
                <p className="text-xl font-bold">{totalEntrees - totalSorties}</p>
                <p className="text-xs text-blue-600">
                  {(totalValeurEntrees - totalValeurSorties).toLocaleString()} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moyenne</p>
                <p className="text-xl font-bold">
                  {Math.round((totalEntrees + totalSorties) / data.length)}
                </p>
                <p className="text-xs text-purple-600">
                  par {period === 'week' ? 'semaine' : period === 'month' ? 'mois' : 'trimestre'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Area */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'volume' ? 'Volume des mouvements' : 'Valeur des mouvements'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.length > 0 ? (
              <div className="flex items-end justify-between h-full gap-2">
                {data.map((item, index) => {
                  const maxVal = activeTab === 'volume' ? maxVolume : maxValue
                  const entreesVal = activeTab === 'volume' ? item.entrees : item.valeurEntrees
                  const sortiesVal = activeTab === 'volume' ? item.sorties : item.valeurSorties

                  return (
                    <div key={index} className="flex flex-col items-center flex-1 max-w-20">
                      <div className="flex items-end gap-1 mb-2 h-48">
                        {/* Barre entrées */}
                        <div
                          className="bg-green-500 rounded-t"
                          style={{
                            height: `${getBarHeight(entreesVal, maxVal)}px`,
                            width: '12px',
                          }}
                          title={`Entrées: ${entreesVal.toLocaleString()}`}
                        />
                        {/* Barre sorties */}
                        <div
                          className="bg-red-500 rounded-t"
                          style={{
                            height: `${getBarHeight(sortiesVal, maxVal)}px`,
                            width: '12px',
                          }}
                          title={`Sorties: ${sortiesVal.toLocaleString()}`}
                        />
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée à afficher</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Entrées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Sorties</span>
        </div>
      </div>
    </div>
  )
}
