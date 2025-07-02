// apps/web/src/components/stocks/mouvements-chart.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@erp/ui";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MouvementStats {
  date: string;
  entrees: number;
  sorties: number;
  transferts: number;
  valeurEntrees: number;
  valeurSorties: number;
}

interface MouvementsChartProps {
  data: MouvementStats[];
  period: 'week' | 'month' | 'quarter';
  onPeriodChange: (period: 'week' | 'month' | 'quarter') => void;
}

export function MouvementsChart({ data, period, onPeriodChange }: MouvementsChartProps) {
  const [activeTab, setActiveTab] = useState<'volume' | 'value'>('volume');

  // Calculs de statistiques
  const totalEntrees = data.reduce((sum, item) => sum + item.entrees, 0);
  const totalSorties = data.reduce((sum, item) => sum + item.sorties, 0);
  const totalValeurEntrees = data.reduce((sum, item) => sum + item.valeurEntrees, 0);
  const totalValeurSorties = data.reduce((sum, item) => sum + item.valeurSorties, 0);

  const maxVolume = Math.max(...data.map(item => Math.max(item.entrees, item.sorties)));
  const maxValue = Math.max(...data.map(item => Math.max(item.valeurEntrees, item.valeurSorties)));

  const getBarHeight = (value: number, max: number) => {
    return Math.max(2, (value / max) * 200); // Hauteur min 2px, max 200px
  };

  return (
    <div className="space-y-6">
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
                <p className="text-xs text-green-600">
                  {totalValeurEntrees.toLocaleString()} €
                </p>
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
                <p className="text-xs text-red-600">
                  {totalValeurSorties.toLocaleString()} €
                </p>
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
                <p className="text-sm text-muted-foreground">Rotation</p>
                <p className="text-xl font-bold">
                  {totalEntrees > 0 ? Math.round((totalSorties / totalEntrees) * 100) : 0}%
                </p>
                <p className="text-xs text-purple-600">Taux moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution des Mouvements
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Sélecteur type */}
              <div className="flex border rounded-md">
                <Button
                  variant={activeTab === 'volume' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab('volume')}
                  className="rounded-r-none"
                >
                  Volume
                </Button>
                <Button
                  variant={activeTab === 'value' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab('value')}
                  className="rounded-l-none"
                >
                  Valeur
                </Button>
              </div>

              {/* Sélecteur période */}
              <div className="flex border rounded-md">
                {(['week', 'month', 'quarter'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPeriodChange(p)}
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Trimestre'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-l pl-12 pb-4">
            {data.map((item, index) => {
              const entreeHeight = activeTab === 'volume' 
                ? getBarHeight(item.entrees, maxVolume)
                : getBarHeight(item.valeurEntrees, maxValue);
              
              const sortieHeight = activeTab === 'volume'
                ? getBarHeight(item.sorties, maxVolume) 
                : getBarHeight(item.valeurSorties, maxValue);

              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  {/* Barres */}
                  <div className="flex items-end gap-1 h-52">
                    <div
                      className="bg-green-500 w-6 rounded-t transition-all duration-300 hover:bg-green-600"
                      style={{ height: `${entreeHeight}px` }}
                      title={`Entrées: ${activeTab === 'volume' ? item.entrees : item.valeurEntrees.toLocaleString() + ' €'}`}
                    />
                    <div
                      className="bg-red-500 w-6 rounded-t transition-all duration-300 hover:bg-red-600"
                      style={{ height: `${sortieHeight}px` }}
                      title={`Sorties: ${activeTab === 'volume' ? item.sorties : item.valeurSorties.toLocaleString() + ' €'}`}
                    />
                  </div>
                  
                  {/* Label date */}
                  <div className="text-xs text-muted-foreground text-center">
                    {new Date(item.date).toLocaleDateString('fr-FR', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Entrées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Sorties</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
