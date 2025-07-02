'use client'

import { CreateFactureDialog } from '@/components/facturation/create-facture-dialog'
import { FacturesFilters } from '@/components/facturation/factures-filters'
import { FacturesTable } from '@/components/facturation/factures-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertTriangle, CheckCircle, Download, Filter, Plus, Search, Send } from 'lucide-react'
import { useState } from 'react'

export default function FacturesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Factures</h1>
          <p className="text-muted-foreground">
            Facturation, suivi des paiements et relances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Alerte factures en retard */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>5 factures</strong> sont en retard de paiement et nécessitent une relance
        </AlertDescription>
      </Alert>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CA facturé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€324,750</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€287,320</div>
            <p className="text-xs text-muted-foreground">88.5% du facturé</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€37,430</div>
            <p className="text-xs text-muted-foreground">11.5% du facturé</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€12,840</div>
            <p className="text-xs text-muted-foreground">5 factures</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <FacturesFilters />
          </CardContent>
        </Card>
      )}

      {/* Recherche */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, projet..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Send className="h-4 w-4 mr-2" />
          Relances auto
        </Button>
      </div>

      {/* Table */}
      <FacturesTable />

      {/* Modal */}
      <CreateFactureDialog 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  )
}