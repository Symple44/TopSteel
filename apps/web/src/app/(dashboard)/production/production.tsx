'use client'

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'
import { AlertCircle, Calendar, CheckCircle, Clock, Plus, Search, XCircle } from 'lucide-react'
import { useState } from 'react'

interface OrdreFabrication {
  id: string
  numero: string
  projet: string
  client: string
  statut: 'En attente' | 'En cours' | 'Terminé' | 'Retard'
  priorite: 'Normale' | 'Haute' | 'Urgente'
  dateDebut: string
  dateFin: string
  progression: number
  technicien: string
  materiaux: string[]
}

const mockOrdres: OrdreFabrication[] = [
  {
    id: '1',
    numero: 'OF-2024-001',
    projet: 'Hangar Industriel A',
    client: 'Entreprise Dubois',
    statut: 'En cours',
    priorite: 'Haute',
    dateDebut: '2024-03-01',
    dateFin: '2024-03-15',
    progression: 75,
    technicien: 'Pierre Martin',
    materiaux: ['Acier S355', 'Boulons M12', 'Peinture RAL 7016']
  },
  {
    id: '2',
    numero: 'OF-2024-002',
    projet: 'Structure Métallique B',
    client: 'Martin Construction',
    statut: 'En attente',
    priorite: 'Normale',
    dateDebut: '2024-03-10',
    dateFin: '2024-03-25',
    progression: 0,
    technicien: 'Jean Dupuis',
    materiaux: ['Acier S235', 'Soudure E70']
  },
  {
    id: '3',
    numero: 'OF-2024-003',
    projet: 'Escalier Métallique',
    client: 'Jean Dupont',
    statut: 'Retard',
    priorite: 'Urgente',
    dateDebut: '2024-02-20',
    dateFin: '2024-03-05',
    progression: 45,
    technicien: 'Marie Claire',
    materiaux: ['Acier Inox', 'Garde-corps']
  }
]

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('ordres')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterPriorite, setFilterPriorite] = useState('toutes')
  const [selectedWeek, setSelectedWeek] = useState('semaine-courante')

  const filteredOrdres = mockOrdres.filter(ordre => {
    const matchesSearch = ordre.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordre.projet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordre.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatut = filterStatut === 'tous' || ordre.statut === filterStatut
    const matchesPriorite = filterPriorite === 'toutes' || ordre.priorite === filterPriorite
    
    return matchesSearch && matchesStatut && matchesPriorite
  })

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'En cours':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'Terminé':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Retard':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'En attente':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatutBadge = (statut: string) => {
    const variants = {
      'En cours': 'default',
      'Terminé': 'secondary',
      'Retard': 'destructive',
      'En attente': 'outline'
    }
    return <Badge variant={variants[statut] as any}>{statut}</Badge>
  }

  const getPrioriteBadge = (priorite: string) => {
    const variants = {
      'Normale': 'outline',
      'Haute': 'secondary',
      'Urgente': 'destructive'
    }
    return <Badge variant={variants[priorite] as any}>{priorite}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Production</h1>
          <p className="text-muted-foreground">Gestion des ordres de fabrication</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Planning
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Ordre
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ordres">Ordres de Fabrication</TabsTrigger>
          <TabsTrigger value="planning">Planning Hebdomadaire</TabsTrigger>
          <TabsTrigger value="ressources">Ressources</TabsTrigger>
          <TabsTrigger value="qualite">Contrôle Qualité</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un ordre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous statuts</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
                <SelectItem value="Retard">En retard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriorite} onValueChange={setFilterPriorite}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes priorités</SelectItem>
                <SelectItem value="Normale">Normale</SelectItem>
                <SelectItem value="Haute">Haute</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="ordres">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrdres.map((ordre) => (
              <Card key={ordre.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ordre.numero}</CardTitle>
                      <p className="text-sm text-muted-foreground">{ordre.projet}</p>
                    </div>
                    <div className="flex gap-1">
                      {getStatutIcon(ordre.statut)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Client: {ordre.client}</p>
                    <p className="text-sm text-muted-foreground">Technicien: {ordre.technicien}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {getStatutBadge(ordre.statut)}
                    {getPrioriteBadge(ordre.priorite)}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{ordre.progression}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${ordre.progression}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p>Début: {new Date(ordre.dateDebut).toLocaleDateString()}</p>
                    <p>Fin prévue: {new Date(ordre.dateFin).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Détails
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Planning Hebdomadaire</CardTitle>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner une semaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semaine-precedente">Semaine précédente</SelectItem>
                    <SelectItem value="semaine-courante">Semaine courante</SelectItem>
                    <SelectItem value="semaine-prochaine">Semaine prochaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour) => (
                    <div key={jour} className="font-medium p-2 bg-gray-100 rounded">
                      {jour}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="min-h-[120px] p-2 border rounded">
                      <div className="text-sm font-medium mb-2">{i + 4}</div>
                      {i < 5 && (
                        <div className="space-y-1">
                          <div className="text-xs p-1 bg-blue-100 rounded">
                            OF-2024-001
                          </div>
                          {i === 2 && (
                            <div className="text-xs p-1 bg-red-100 rounded">
                              OF-2024-003
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ressources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Techniciens Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Pierre Martin', 'Jean Dupuis', 'Marie Claire'].map((technicien) => (
                    <div key={technicien} className="flex justify-between items-center p-2 border rounded">
                      <span>{technicien}</span>
                      <Badge variant="outline">Disponible</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Matériaux en Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { nom: 'Acier S355', stock: 250, unite: 'kg' },
                    { nom: 'Acier S235', stock: 180, unite: 'kg' },
                    { nom: 'Boulons M12', stock: 500, unite: 'pcs' }
                  ].map((materiau) => (
                    <div key={materiau.nom} className="flex justify-between items-center p-2 border rounded">
                      <span>{materiau.nom}</span>
                      <span className="text-sm">{materiau.stock} {materiau.unite}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qualite">
          <Card>
            <CardHeader>
              <CardTitle>Contrôles Qualité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  Module contrôle qualité en développement
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}