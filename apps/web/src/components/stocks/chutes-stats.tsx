// apps/web/src/components/stocks/chutes-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { AlertTriangle, CheckCircle, DollarSign, Package, Recycle, TrendingUp } from 'lucide-react'

interface ChutesStatsProps {
  stats: {
    totalChutes: number
    valeurTotale: number
    tauxReutilisation: number
    economiesRealisees: number
    chutesExcellentes: number
    chutesDegradees: number
    evolutionMois: number
  }
}

export function ChutesStats({ stats }: ChutesStatsProps) {
  const statCards = [
    {
      title: 'Total Chutes',
      value: stats.totalChutes.toLocaleString(),
      icon: Package,
      description: 'Références en stock',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Valeur Totale',
      value: `${stats.valeurTotale.toLocaleString()} €`,
      icon: DollarSign,
      description: 'Valeur estimée',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Taux Réutilisation',
      value: `${stats.tauxReutilisation}%`,
      icon: Recycle,
      description: 'Optimisation atteinte',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Économies',
      value: `${stats.economiesRealisees.toLocaleString()} €`,
      icon: TrendingUp,
      description: `+${stats.evolutionMois}% ce mois`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon

          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Qualité des chutes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Chutes Excellentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.chutesExcellentes}</div>
                <p className="text-sm text-muted-foreground">Prêtes à réutiliser</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">
                  {Math.round((stats.chutesExcellentes / stats.totalChutes) * 100)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.chutesExcellentes / stats.totalChutes) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Chutes Dégradées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-600">{stats.chutesDegradees}</div>
                <p className="text-sm text-muted-foreground">À traiter en priorité</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg font-bold text-red-600">
                  {Math.round((stats.chutesDegradees / stats.totalChutes) * 100)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.chutesDegradees / stats.totalChutes) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse comparative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Analyse de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.tauxReutilisation}%</div>
              <p className="text-sm text-muted-foreground mt-1">Taux de réutilisation</p>
              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    stats.tauxReutilisation >= 70
                      ? 'bg-green-100 text-green-600'
                      : stats.tauxReutilisation >= 50
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                  }`}
                >
                  {stats.tauxReutilisation >= 70
                    ? 'Excellent'
                    : stats.tauxReutilisation >= 50
                      ? 'Correct'
                      : 'À améliorer'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.economiesRealisees.toLocaleString()} €
              </div>
              <p className="text-sm text-muted-foreground mt-1">Économies réalisées</p>
              <div className="mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                  +{stats.evolutionMois}% ce mois
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(
                  ((stats.valeurTotale - stats.economiesRealisees) / stats.valeurTotale) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-muted-foreground mt-1">Potentiel restant</p>
              <div className="mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                  {(stats.valeurTotale - stats.economiesRealisees).toLocaleString()} € disponible
                </span>
              </div>
            </div>
          </div>

          {/* Barre de progression générale */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progression vers l'objectif optimal (80%)</span>
              <span>{stats.tauxReutilisation}/80%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  stats.tauxReutilisation >= 80
                    ? 'bg-green-500'
                    : stats.tauxReutilisation >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((stats.tauxReutilisation / 80) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
