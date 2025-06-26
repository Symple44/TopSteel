'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@erp/ui'
import { Download, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Client {
  id: string
  nom: string
  email: string
  telephone: string
  type: 'Particulier' | 'Entreprise'
  statut: 'Actif' | 'Inactif' | 'Prospect'
  createdAt: string
  projets: number
  ca: number
}

const mockClients: Client[] = [
  {
    id: '1',
    nom: 'Entreprise Dubois',
    email: 'contact@dubois.fr',
    telephone: '01 23 45 67 89',
    type: 'Entreprise',
    statut: 'Actif',
    createdAt: '2024-01-15',
    projets: 5,
    ca: 250000
  },
  {
    id: '2',
    nom: 'Martin Construction',
    email: 'info@martin-construction.fr',
    telephone: '01 98 76 54 32',
    type: 'Entreprise',
    statut: 'Actif',
    createdAt: '2024-02-20',
    projets: 3,
    ca: 180000
  },
  {
    id: '3',
    nom: 'Jean Dupont',
    email: 'jean.dupont@email.fr',
    telephone: '06 12 34 56 78',
    type: 'Particulier',
    statut: 'Prospect',
    createdAt: '2024-03-10',
    projets: 0,
    ca: 0
  }
]

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('liste')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'tous' || client.type === filterType
    const matchesStatut = filterStatut === 'tous' || client.statut === filterStatut
    
    return matchesSearch && matchesType && matchesStatut
  })

  const getStatutBadge = (statut: string) => {
    const variants = {
      'Actif': 'default',
      'Inactif': 'secondary',
      'Prospect': 'outline'
    }
    return <Badge variant={variants[statut] as any}>{statut}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Clients</h1>
          <p className="text-muted-foreground">Gérez vos clients et prospects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="liste">Liste des Clients</TabsTrigger>
          <TabsTrigger value="cartes">Vue Cartes</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous types</SelectItem>
                <SelectItem value="Entreprise">Entreprise</SelectItem>
                <SelectItem value="Particulier">Particulier</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous statuts</SelectItem>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
                <SelectItem value="Prospect">Prospect</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="liste">
          <Card>
            <CardHeader>
              <CardTitle>Clients ({filteredClients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Nom</th>
                      <th className="text-left p-4">Contact</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Projets</th>
                      <th className="text-left p-4">CA</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{client.nom}</div>
                            <div className="text-sm text-gray-500">#{client.id}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="text-sm">{client.email}</div>
                            <div className="text-sm text-gray-500">{client.telephone}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{client.type}</Badge>
                        </td>
                        <td className="p-4">
                          {getStatutBadge(client.statut)}
                        </td>
                        <td className="p-4">{client.projets}</td>
                        <td className="p-4">{client.ca.toLocaleString()} €</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.nom}</CardTitle>
                    {getStatutBadge(client.statut)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">{client.email}</div>
                    <div className="text-sm text-gray-600">{client.telephone}</div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm">Projets: {client.projets}</span>
                      <span className="text-sm font-medium">{client.ca.toLocaleString()} €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="statistiques">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Clients Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockClients.filter(c => c.statut === 'Actif').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockClients.filter(c => c.statut === 'Prospect').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>CA Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockClients.reduce((sum, c) => sum + c.ca, 0).toLocaleString()} €
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}