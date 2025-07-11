'use client'

import { formatCurrency } from '@/lib/utils'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@erp/ui'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calculator,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Hammer,
  Package,
  Plus,
  Save,
  Star,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import React from 'react'
import { useState } from 'react'

// Données mockées
const mockTemplates = [
  {
    id: '1',
    nom: 'Portail standard',
    description: 'Portail métallique standard avec automatisme',
    prix: 2500,
    duree: 5,
    materiaux: ['Acier galvanisé', 'Moteur BFT', 'Télécommandes'],
  },
]

const mockChiffrages = [
  {
    id: '1',
    reference: 'CHF-2024-001',
    client: 'Maison Martin',
    projet: 'Portail résidentiel',
    montant: 3250,
    statut: 'En cours',
    dateCreation: '2024-01-15',
  },
]

export default function ChiffragePage() {
  const [activeTab, setActiveTab] = useState('nouveau')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            Chiffrage
          </h1>
          <p className="text-muted-foreground">Créer et gérer vos devis rapidement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chiffrage
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nouveau">Nouveau chiffrage</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Input id="client" placeholder="Nom du client" />
                </div>
                <div>
                  <Label htmlFor="projet">Projet</Label>
                  <Input id="projet" placeholder="Description du projet" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Éléments du chiffrage</CardTitle>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un élément
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Aucun élément ajouté. Cliquez sur "Ajouter un élément" pour commencer.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{template.nom}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{formatCurrency(template.prix)}</span>
                        <span className="text-muted-foreground">{template.duree} jours</span>
                      </div>
                    </div>
                    <Button size="sm">Utiliser</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockChiffrages.map((chiffrage) => (
                    <TableRow key={chiffrage.id}>
                      <TableCell className="font-medium">{chiffrage.reference}</TableCell>
                      <TableCell>{chiffrage.client}</TableCell>
                      <TableCell>{chiffrage.projet}</TableCell>
                      <TableCell>{formatCurrency(chiffrage.montant)}</TableCell>
                      <TableCell>
                        <Badge variant={chiffrage.statut === 'Validé' ? 'default' : 'secondary'}>
                          {chiffrage.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>{chiffrage.dateCreation}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Voir
                          </Button>
                          <Button size="sm" variant="outline">
                            Modifier
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
