'use client'

import { CreatePaiementDialog } from '@/components/facturation/create-paiement-dialog'
import { PaiementsTable } from '@/components/facturation/paiements-table'
import { RapprochementBancaire } from '@/components/facturation/rapprochement-bancaire'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import {
  Calendar as CalendarIcon,
  Filter as FilterIcon,
  Plus as PlusIcon,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import React from 'react'
import { useState } from 'react'

export default function PaiementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('encaissements')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground">Gestion des encaissements et décaissements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Échéancier
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Saisir paiement
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encaissements du mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ 45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Décaissements du mois</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ 12,234.56</div>
            <p className="text-xs text-muted-foreground">-15.3% par rapport au mois dernier</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Graphique des paiements (à implémenter)
          </div>
        </CardContent>
      </Card>

      {/* Onglets encaissements/décaissements */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="encaissements">Encaissements</TabsTrigger>
          <TabsTrigger value="decaissements">Décaissements</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement bancaire</TabsTrigger>
        </TabsList>

        <TabsContent value="encaissements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par client, facture..." className="pl-10" />
            </div>
            <Button variant="outline">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          <PaiementsTable type="encaissement" />
        </TabsContent>

        <TabsContent value="decaissements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par fournisseur, facture..." className="pl-10" />
            </div>
            <Button variant="outline">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          <PaiementsTable type="decaissement" />
        </TabsContent>

        <TabsContent value="rapprochement" className="space-y-4">
          <RapprochementBancaire />
        </TabsContent>
      </Tabs>

      {/* Dialog de création */}
      <CreatePaiementDialog open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}
