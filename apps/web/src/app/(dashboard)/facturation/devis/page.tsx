'use client'

import { Clock, FileText, Filter, Plus, Search, Send } from 'lucide-react'
import { useState } from 'react'
import { CreateDevisDialog } from '@/components/facturation/create-devis-dialog'
import { DevisFilters } from '@/components/facturation/devis-filters'
import { DevisTable } from '@/components/facturation/devis-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function DevisPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Devis</h1>
          <p className="text-muted-foreground">Création, suivi et conversion des devis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Devis totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+8 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€847,420</div>
            <p className="text-xs text-muted-foreground">+12.5% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68%</div>
            <p className="text-xs text-muted-foreground">+3% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">23</div>
            <p className="text-xs text-muted-foreground">Action requise</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <DevisFilters />
          </CardContent>
        </Card>
      )}

      {/* Recherche */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par référence, client, projet..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Send className="h-4 w-4 mr-2" />
          Relances
        </Button>
      </div>

      {/* Table */}
      <DevisTable />

      {/* Modal */}
      <CreateDevisDialog open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}
