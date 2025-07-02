'use client'

import { AddMaterialDialog } from '@/components/stocks/add-material-dialog'
import { StockAlertsPanel } from '@/components/stocks/stock-alerts-panel'
import { StocksFilters } from '@/components/stocks/stocks-filters'
import { StocksTable } from '@/components/stocks/stocks-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Filter, Package, Plus, Search, TrendingDown } from 'lucide-react'
import { useState } from 'react'

export default function StocksPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-muted-foreground">
            Inventaire, mouvements et optimisation des matériaux
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertes
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs"
            >
              3
            </Badge>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter matériau
          </Button>
        </div>
      </div>

      {/* Alertes critiques */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>3 matériaux</strong> sont en stock critique et nécessitent un réapprovisionnement
        </AlertDescription>
      </Alert>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total références
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€127,430</div>
            <p className="text-xs text-muted-foreground">+3.2% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Stock critique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">23</div>
            <p className="text-xs text-muted-foreground">Seuil d'alerte atteint</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux rotation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4</div>
            <p className="text-xs text-muted-foreground">Rotations/an</p>
          </CardContent>
        </Card>
      </div>

      {/* Panel d'alertes */}
      {showAlerts && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Alertes Stock Critique</CardTitle>
          </CardHeader>
          <CardContent>
            <StockAlertsPanel />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <StocksFilters />
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, nom, fournisseur..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <TrendingDown className="h-4 w-4 mr-2" />
          Mouvements
        </Button>
      </div>

      {/* Table */}
      <StocksTable />

      {/* Modals */}
      <AddMaterialDialog 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
    </div>
  )
}