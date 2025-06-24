'use client'

import { useState } from 'react'
import { 
  Users, Plus, Search, Building2, User, Mail, Phone, MapPin, 
  FileText, Euro, MoreVertical, Edit, Eye, Trash2, TrendingUp, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'

// Types
enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE',
}

interface Client {
  id: string
  type: ClientType
  nom: string
  email: string
  telephone: string
  adresse: { rue: string; codePostal: string; ville: string; pays: string }
  siret?: string
  dateCreation: Date
  projetsActifs: number
  projetsTotaux: number
  chiffreAffaires: number
  dernierContact: Date
}

// Données mockées
const mockClients: Client[] = [
  {
    id: '1',
    type: ClientType.PROFESSIONNEL,
    nom: 'Entreprise ABC',
    email: 'contact@abc.fr',
    telephone: '02 40 12 34 56',
    adresse: { 
      rue: '123 Rue de l&apos;Industrie', 
      codePostal: '44100', 
      ville: 'Nantes', 
      pays: 'France' 
    },
    siret: '123 456 789 00012',
    dateCreation: new Date('2023-05-15'),
    projetsActifs: 2,
    projetsTotaux: 8,
    chiffreAffaires: 245600,
    dernierContact: new Date('2025-06-15'),
  },
  {
    id: '2',
    type: ClientType.PROFESSIONNEL,
    nom: 'Société XYZ',
    email: 'info@xyz.fr',
    telephone: '02 51 23 45 67',
    adresse: { 
      rue: '45 Avenue des Entrepreneurs', 
      codePostal: '44800', 
      ville: 'Saint-Herblain', 
      pays: 'France' 
    },
    siret: '987 654 321 00023',
    dateCreation: new Date('2022-10-20'),
    projetsActifs: 1,
    projetsTotaux: 12,
    chiffreAffaires: 389500,
    dernierContact: new Date('2025-06-10'),
  },
  {
    id: '3',
    type: ClientType.PARTICULIER,
    nom: 'Jean Dupont',
    email: 'jean.dupont@email.fr',
    telephone: '06 12 34 56 78',
    adresse: { 
      rue: '15 Rue des Lilas', 
      codePostal: '44300', 
      ville: 'Nantes', 
      pays: 'France' 
    },
    dateCreation: new Date('2024-08-12'),
    projetsActifs: 0,
    projetsTotaux: 2,
    chiffreAffaires: 18500,
    dernierContact: new Date('2025-05-20'),
  },
]

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('liste')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('tous')
  const [selectedClient, setSelectedClient] = useState(mockClients[0])

  const filteredClients = mockClients.filter((client) => {
    const matchSearch = 
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.adresse.ville.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === 'tous' || client.type === filterType
    return matchSearch && matchType
  })

  const totalClients = mockClients.length
  const clientsActifs = mockClients.filter(c => c.projetsActifs > 0).length
  const chiffreAffairesTotal = mockClients.reduce((sum, c) => sum + c.chiffreAffaires, 0)
  const nouveauxClients = mockClients.filter(c => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return c.dateCreation > threeMonthsAgo
  }).length

  const getTypeBadge = (type: ClientType) => {
    const config = {
      [ClientType.PARTICULIER]: { label: 'Particulier', variant: 'secondary' as const, icon: User },
      [ClientType.PROFESSIONNEL]: { label: 'Professionnel', variant: 'default' as const, icon: Building2 },
      [ClientType.COLLECTIVITE]: { label: 'Collectivité', variant: 'outline' as const, icon: Building2 },
    }[type]
    
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des clients</h1>
          <p className="text-muted-foreground">Gérez votre base de clients et prospects</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">{clientsActifs} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(chiffreAffairesTotal)}</div>
            <p className="text-xs text-muted-foreground">Depuis le début</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{nouveauxClients}</div>
            <p className="text-xs text-muted-foreground">Ces 3 derniers mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA moyen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(chiffreAffairesTotal / totalClients)}</div>
            <p className="text-xs text-muted-foreground">Par client</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="liste">Liste des clients</TabsTrigger>
          <TabsTrigger value="detail">Fiche client</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par nom, email ou ville..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-9" 
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Type de client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les types</SelectItem>
                    <SelectItem value={ClientType.PARTICULIER}>Particuliers</SelectItem>
                    <SelectItem value={ClientType.PROFESSIONNEL}>Professionnels</SelectItem>
                    <SelectItem value={ClientType.COLLECTIVITE}>Collectivités</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des clients */}
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead className="text-center">Projets</TableHead>
                      <TableHead className="text-right">CA total</TableHead>
                      <TableHead>Dernier contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow 
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedClient(client)
                          setActiveTab('detail')
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(client.nom)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.nom}</p>
                              {client.siret && (
                                <p className="text-xs text-muted-foreground">SIRET: {client.siret}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(client.type)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{client.email}</p>
                            <p className="text-xs text-muted-foreground">{client.telephone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{client.adresse.ville}</TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <p className="font-medium">{client.projetsActifs}</p>
                            <p className="text-xs text-muted-foreground">/ {client.projetsTotaux} total</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(client.chiffreAffaires)}
                        </TableCell>
                        <TableCell>{formatDate(client.dernierContact)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          {selectedClient && (
            <>
              {/* En-tête client */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {getInitials(selectedClient.nom)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold">{selectedClient.nom}</h2>
                          {getTypeBadge(selectedClient.type)}
                        </div>
                        <p className="text-muted-foreground">
                          Client depuis le {formatDate(selectedClient.dateCreation)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau projet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations détaillées */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Coordonnées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.telephone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p>{selectedClient.adresse.rue}</p>
                        <p>{selectedClient.adresse.codePostal} {selectedClient.adresse.ville}</p>
                      </div>
                    </div>
                    {selectedClient.siret && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">SIRET: {selectedClient.siret}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Projets actifs</span>
                      <span className="font-medium">{selectedClient.projetsActifs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Projets totaux</span>
                      <span className="font-medium">{selectedClient.projetsTotaux}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CA total</span>
                      <span className="font-medium">{formatCurrency(selectedClient.chiffreAffaires)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CA moyen/projet</span>
                      <span className="font-medium">
                        {formatCurrency(selectedClient.chiffreAffaires / (selectedClient.projetsTotaux || 1))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dernier contact</span>
                      <span className="font-medium">{formatDate(selectedClient.dernierContact)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
