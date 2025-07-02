// apps/web/src/components/stocks/chutes-stats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui";
import { TrendingUp, Recycle, DollarSign, Package, AlertTriangle, CheckCircle } from "lucide-react";

interface ChutesStatsProps {
  stats: {
    totalChutes: number;
    valeurTotale: number;
    tauxReutilisation: number;
    economiesRealisees: number;
    chutesExcellentes: number;
    chutesDegradees: number;
    evolutionMois: number;
  };
}

export function ChutesStats({ stats }: ChutesStatsProps) {
  const statCards = [
    {
      title: "Total Chutes",
      value: stats.totalChutes.toLocaleString(),
      icon: Package,
      description: "Références en stock",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Valeur Totale", 
      value: `${stats.valeurTotale.toLocaleString()} €`,
      icon: DollarSign,
      description: "Valeur estimée",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Taux Réutilisation",
      value: `${stats.tauxReutilisation}%`,
      icon: Recycle,
      description: "Optimisation atteinte",
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
    },
    {
      title: "Économies",
      value: `${stats.economiesRealisees.toLocaleString()} €`,
      icon: TrendingUp,
      description: `+${stats.evolutionMois}% ce mois`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
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
          );
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
              <span className="text-3xl font-bold text-green-600">
                {stats.chutesExcellentes}
              </span>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {Math.round((stats.chutesExcellentes / stats.totalChutes) * 100)}% du total
                </p>
                <p className="text-xs text-green-600">Qualité optimale</p>
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
              <span className="text-3xl font-bold text-red-600">
                {stats.chutesDegradees}
              </span>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {Math.round((stats.chutesDegradees / stats.totalChutes) * 100)}% du total
                </p>
                <p className="text-xs text-red-600">À traiter rapidement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
