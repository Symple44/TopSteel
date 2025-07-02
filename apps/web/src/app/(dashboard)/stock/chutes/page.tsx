'use client'

import { ChutesOptimizer } from '@/components/stocks/chutes-optimizer'
import { ChutesStats } from '@/components/stocks/chutes-stats'
import { ChutesTable } from '@/components/stocks/chutes-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calculator, Recycle, Search } from 'lucide-react'
import { useState } from 'react'

export default function ChutesPage() {
  const [showOptimizer, setShowOptimizer] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimisation des Chutes</h1>
          <p className="text-muted-foreground">
            Gestion et valorisation des chutes métalliques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Calculer optimisation
          </Button>
          <Button onClick={() => setShowOptimizer(true)}>
            <Recycle className="h-4 w-4 mr-2" />
            Optimiseur
          </Button>
        </div>
      </div>

      {/* Stats chutes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur chutes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,450</div>
            <p className="text-xs text-muted-foreground">Stock disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux réutilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">67%</div>
            <p className="text-xs text-muted-foreground">+5% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Économies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€3,240</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chutes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par matériau, dimensions..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Acier
        </Button>
        <Button variant="outline">
          Aluminium
        </Button>
        <Button variant="outline">
          Inox
        </Button>
      </div>

      {/* Statistiques détaillées */}
      <ChutesStats />

      {/* Table des chutes */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des Chutes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChutesTable />
        </CardContent>
      </Card>

      {/* Optimiseur modal */}
      {showOptimizer && (
        <ChutesOptimizer 
          open={showOptimizer} 
          onOpenChange={setShowOptimizer} 
        />
      )}
    </div>
  )
}