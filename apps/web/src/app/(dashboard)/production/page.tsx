import React from 'react'
;('use client')

import { CreateOrdreDialog } from '@/components/production/create-ordre-dialog'
import { ProductionFilters } from '@/components/production/production-filters'
import { ProductionTable } from '@/components/production/production-table'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Filter, Plus } from 'lucide-react'
import { useState } from 'react'

export default function ProductionPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Handlers pour les filtres
  const handleFiltersChange = (filters: unknown) => {
    // TODO: Implémenter la logique de filtrage
  }

  const handleFiltersReset = () => {
    // TODO: Implémenter la logique de reset
  }

  // Données mock pour la démonstration
  const mockOrdres = [
    {
      id: 1,
      numero: 'OF-2024-001',
      description: 'Portail résidentiel',
      statut: 'EN_COURS',
      priorite: 'NORMALE',
      avancement: 65,
      dateDebutPrevue: new Date('2024-01-15'),
      dateFinPrevue: new Date('2024-01-22'),
      responsable: 'Jean Dupont',
    },
    {
      id: 2,
      numero: 'OF-2024-002',
      description: 'Garde-corps balcon',
      statut: 'PLANIFIE',
      priorite: 'HAUTE',
      avancement: 0,
      dateDebutPrevue: new Date('2024-01-25'),
      dateFinPrevue: new Date('2024-01-30'),
      responsable: 'Marie Martin',
    },
  ]

  const handleView = (id: number) => {
    // TODO: Navigation vers détail
  }

  const handleEdit = (id: number) => {
    // TODO: Navigation vers édition
  }

  const handleStatusChange = (id: number, status: string) => {
    // TODO: Mise à jour statut
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production</h1>
          <p className="text-muted-foreground">Gestion des ordres de fabrication et planning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel ordre
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">À démarrer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Action requise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">45</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <ProductionFilters onFiltersChange={handleFiltersChange} onReset={handleFiltersReset} />
      )}

      {/* Table des ordres */}
      <Card>
        <CardHeader>
          <CardTitle>Ordres de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionTable
            ordres={mockOrdres}
            onView={handleView}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>

      {/* Modal création ordre */}
      <CreateOrdreDialog open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}
