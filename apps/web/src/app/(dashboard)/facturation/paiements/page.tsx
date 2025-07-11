'use client'

import React from 'react'
import { useState } from 'react'
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
  TabsTrigger
} from '@erp/ui'
import { 
  Calendar as CalendarIcon,
  Filter as FilterIcon,
  Plus as PlusIcon,
  Search,
  TrendingDown,
  TrendingUp 
} from 'lucide-react'
import { CreatePaiementDialog } from '@/components/facturation/create-paiement-dialog'
import { PaiementsTable } from '@/components/facturation/paiements-table'
import { RapprochementBancaire } from '@/components/facturation/rapprochement-bancaire'
export default function PaiementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('encaissements')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
          <p className="text-muted-foreground">Encaissements, décaissements et rapprochements</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Encaissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€45,320</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Décaissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€23,750</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solde net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+€21,570</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€127,850</div>
            <p className="text-xs text-muted-foreground">Position actuelle</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de la trésorerie</CardTitle>
        </CardHeader>
        <CardContent>
          <PaiementsChart />
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="encaissements">Encaissements</TabsTrigger>
          <TabsTrigger value="decaissements">Décaissements</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement</TabsTrigger>
        </TabsList>

        <TabsContent value="encaissements" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par fournisseur, facture..." className="pl-10" />
            </div>
            <Button variant="outline">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          <PaiementsTable type="decaissement" />
        </TabsContent>

        <TabsContent value="rapprochement">
          <RapprochementBancaire />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <CreatePaiementDialog open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}
