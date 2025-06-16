'use client'

import { useState } from 'react'
import { 
  Factory, 
  Plus, 
  Calendar,
  Clock,
  Users,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Filter,
  BarChart3,
  Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { StatutProduction, PrioriteProduction } from '@/types'

// Données mockées pour la démonstration
const mockOrdresFabrication = [
  {
    id: '1',
    numero: 'OF-2025-0092',
    projet: {
      reference: 'PRJ-2025-0142',
      client: 'Entreprise ABC',
      description: 'Garde-corps et escalier métallique',
    },
    statut: StatutProduction.EN_COURS,
    priorite: PrioriteProduction.HAUTE,
    dateDebut: new Date('2025-06-17'),
    dateFin: new Date('2025-06-21'),
    progression: 65,
    techniciens: [
      { id: '1', nom: 'Pierre Durand' },
      { id: '2', nom: 'Marc Leblanc' },
    ],
    operationsTerminees: 3,
    operationsTotales: 5,
  },
  {
    id: '2',
    numero: 'OF-2025-0093',
    projet: {
      reference: 'PRJ-2025-0143',
      client: 'SARL Martin',
      description: 'Portail coulissant 6m',
    },
    statut: StatutProduction.EN_COURS,
    priorite: PrioriteProduction.NORMALE,
    dateDebut: new Date('2025-06-18'),
    dateFin: new Date('2025-06-20'),
    progression: 40,
    techniciens: [
      { id: '3', nom: 'Jean Martin' },
    ],
    operationsTerminees: 2,
    operationsTotales: 5,
  },
  {
    id: '3',
    numero: 'OF-2025-0094',
    projet: {
      reference: 'PRJ-2025-0144',
      client: 'Mairie de Saint-Herblain',
      description: 'Passerelle piétonne',
    },
    statut: StatutProduction.PLANIFIE,
    priorite: PrioriteProduction.HAUTE,
    dateDebut: new Date('2025-06-19'),
    dateFin: new Date('2025-06-28'),
    progression: 0,
    techniciens: [],
    operationsTerminees: 0,
    operationsTotales: 8,
  },
  {
    id: '4',
    numero: 'OF-2025-0091',
    projet: {
      reference: 'PRJ-2025-0140',
      client: 'Société XYZ',
      description: 'Structure hangar 200m²',
    },
    statut: StatutProduction.TERMINE,
    priorite: PrioriteProduction.NORMALE,
    dateDebut: new Date('2025-06-10'),
    dateFin: new Date('2025-06-15'),
    progression: 100,
    techniciens: [
      { id: '1', nom: 'Pierre Durand' },
      { id: '4', nom: 'Sophie Bernard' },
    ],
    operationsTerminees: 6,
    operationsTotales: 6,
  },
]

const mockPlanningData = [
  {
    technicien: 'Pierre Durand',
    lundi: { projet: 'PRJ-2025-0142', operation: 'Soudure' },
    mardi: { projet: 'PRJ-2025-0142', operation: 'Soudure' },
    mercredi: { projet: 'PRJ-2025-0144', operation: 'Découpe' },
    jeudi: { projet: 'PRJ-2025-0144', operation: 'Assemblage' },
    vendredi: { projet: 'PRJ-2025-0144', operation: 'Assemblage' },
  },
  {
    technicien: 'Marc Leblanc',
    lundi: { projet: 'PRJ-2025-0142', operation: 'Pliage' },
    mardi: { projet: 'PRJ-2025-0142', operation: 'Pliage' },
    mercredi: null,
    jeudi: { projet: 'PRJ-2025-0143', operation: 'Usinage' },
    vendredi: { projet: 'PRJ-2025-0143', operation: 'Finition' },
  },
  {
    technicien: 'Jean Martin',
    lundi: { projet: 'PRJ-2025-0143', operation: 'Découpe' },
    mardi: { projet: 'PRJ-2025-0143', operation: 'Soudure' },
    mercredi: { projet: 'PRJ-2025-0143', operation: 'Soudure' },
    jeudi: null,
    vendredi: null,
  },
]

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('ordres')
  const [filterStatut, setFilterStatut] = useState<string>('tous')
  const [selectedWeek, setSelectedWeek] = useState('current')

  const getStatutBadge = (statut: StatutProduction) => {
    const statusConfig = {
      [StatutProduction.PLANIFIE]: { 
        label: 'Planifié', 
        variant: 'outline' as const, 
        icon: Calendar,
        color: 'text-gray-600'
      },
      [StatutProduction.EN_COURS]: { 
        label: 'En cours', 
        variant: 'default' as const, 
        icon: PlayCircle,
        color: 'text-blue-600'
      },
      [StatutProduction.PAUSE]: { 
        label: 'En pause', 
        variant: 'secondary' as const, 
        icon: PauseCircle,
        color: 'text-yellow-600'
      },
      [StatutProduction.TERMINE]: { 
        label: 'Terminé', 
        variant: 'secondary' as const, 
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      [StatutProduction.ANNULE]: { 
        label: 'Annulé', 
        variant: 'destructive' as const, 
        icon: XCircle,
        color: 'text-red-600'
      },
    }
    
    const config = statusConfig[statut]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={cn("h-3 w-3", config.color)} />
        {config.label}
      </Badge>
    )
  }

  const getPrioriteBadge = (priorite: PrioriteProduction) => {
    const prioriteConfig = {
      [PrioriteProduction.BASSE]: { 
        label: 'Basse', 
        className: 'bg-gray-100 text-gray-800 border-gray-300' 
      },
      [PrioriteProduction.NORMALE]: { 
        label: 'Normale', 
        className: 'bg-blue-100 text-blue-800 border-blue-300' 
      },
      [PrioriteProduction.HAUTE]: { 
        label: 'Haute', 
        className: 'bg-orange-100 text-orange-800 border-orange-300' 
      },
      [PrioriteProduction.URGENTE]: { 
        label: 'Urgente', 
        className: 'bg-red-100 text-red-800 border-red-300 animate-pulse' 
      },
    }
    
    const config = prioriteConfig[priorite]
    
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        config.className
      )}>
        {config.label}
      </span>
    )
  }

  const filteredOrdres = mockOrdresFabrication.filter((ordre) => {
    return filterStatut === 'tous' || ordre.statut === filterStatut
  })

  const ordresEnCours = mockOrdresFabrication.filter(
    o => o.statut === StatutProduction.EN_COURS
  ).length

  const ordresUrgents = mockOrdresFabrication.filter(
    o => o.priorite === PrioriteProduction.URGENTE || o.priorite === PrioriteProduction.HAUTE
  ).length

  const tauxOccupation = Math.round(
    (mockPlanningData.reduce((total, tech) => {
      const joursOccupes = [tech.lundi, tech.mardi, tech.mercredi, tech.jeudi, tech.vendredi]
        .filter(jour => jour !== null).length
      return total + (joursOccupes / 5)
    }, 0) / mockPlanningData.length) * 100
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion de la production</h1>
          <p className="text-muted-foreground">
            Suivez et planifiez vos ordres de fabrication
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel ordre
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordres en cours</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordresEnCours}</div>
            <p className="text-xs text-muted-foreground">
              Sur {mockOrdresFabrication.length} au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordres urgents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{ordresUrgents}</div>
            <p className="text-xs text-muted-foreground">
              Priorité haute ou urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxOccupation}%</div>
            <Progress value={tauxOccupation} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 jours</div>
            <p className="text-xs text-muted-foreground">
              Par ordre de fabrication
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="ordres">Ordres de fabrication</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="ordres" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value={StatutProduction.PLANIFIE}>Planifié</SelectItem>
                      <SelectItem value={StatutProduction.EN_COURS}>En cours</SelectItem>
                      <SelectItem value={StatutProduction.PAUSE}>En pause</SelectItem>
                      <SelectItem value={StatutProduction.TERMINE}>Terminé</SelectItem>
                      <SelectItem value={StatutProduction.ANNULE}>Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Plus de filtres
                  </Button>
                </div>
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Vue Gantt
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des ordres */}
          <div className="grid gap-4">
            {filteredOrdres.map((ordre) => (
              <Card key={ordre.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{ordre.numero}</h3>
                        {getStatutBadge(ordre.statut)}
                        {getPrioriteBadge(ordre.priorite)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{ordre.projet.reference}</span> - {ordre.projet.client}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ordre.projet.description}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Période</p>
                      <p className="text-sm font-medium">
                        {formatDate(ordre.dateDebut)} - {formatDate(ordre.dateFin)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opérations</p>
                      <p className="text-sm font-medium">
                        {ordre.operationsTerminees} / {ordre.operationsTotales} terminées
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Techniciens</p>
                      <div className="flex -space-x-2 mt-1">
                        {ordre.techniciens.map((tech) => (
                          <Avatar key={tech.id} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {getInitials(tech.nom)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {ordre.techniciens.length === 0 && (
                          <span className="text-sm text-muted-foreground">Non assigné</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progression</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={ordre.progression} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{ordre.progression}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    {ordre.statut === StatutProduction.PLANIFIE && (
                      <Button size="sm">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Démarrer
                      </Button>
                    )}
                    {ordre.statut === StatutProduction.EN_COURS && (
                      <>
                        <Button size="sm" variant="outline">
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                        <Button size="sm">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Terminer
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      Voir détails
                    </Button>
                  </div>
                </div>

                {/* Barre de progression colorée */}
                <div className="h-1 bg-gray-200">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      ordre.statut === StatutProduction.TERMINE ? "bg-green-500" :
                      ordre.statut === StatutProduction.EN_COURS ? "bg-blue-500" :
                      ordre.statut === StatutProduction.PAUSE ? "bg-yellow-500" :
                      "bg-gray-400"
                    )}
                    style={{ width: `${ordre.progression}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planning de production</CardTitle>
                  <CardDescription>
                    Vue hebdomadaire de l'affectation des techniciens
                  </CardDescription>
                </div>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Cette semaine</SelectItem>
                    <SelectItem value="next">Semaine prochaine</SelectItem>
                    <SelectItem value="custom">Choisir une semaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Technicien</th>
                      <th className="text-center py-3 px-4 font-medium">Lundi</th>
                      <th className="text-center py-3 px-4 font-medium">Mardi</th>
                      <th className="text-center py-3 px-4 font-medium">Mercredi</th>
                      <th className="text-center py-3 px-4 font-medium">Jeudi</th>
                      <th className="text-center py-3 px-4 font-medium">Vendredi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPlanningData.map((planning, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(planning.technicien)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{planning.technicien}</span>
                          </div>
                        </td>
                        {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((jour) => {
                          const data = planning[jour as keyof typeof planning]
                          if (!data || typeof data === 'string') {
                            return (
                              <td key={jour} className="py-3 px-4">
                                <div className="text-center text-sm text-muted-foreground">
                                  Disponible
                                </div>
                              </td>
                            )
                          }
                          return (
                            <td key={jour} className="py-3 px-4">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                  {data.projet}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {data.operation}
                                </p>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline">
                  <Wrench className="mr-2 h-4 w-4" />
                  Gérer les affectations
                </Button>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Optimiser le planning
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Productivité par technicien</CardTitle>
                <CardDescription>
                  Heures travaillées cette semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nom: 'Pierre Durand', heures: 38, objectif: 40 },
                    { nom: 'Marc Leblanc', heures: 35, objectif: 40 },
                    { nom: 'Jean Martin', heures: 42, objectif: 40 },
                    { nom: 'Sophie Bernard', heures: 36, objectif: 40 },
                  ].map((tech, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech.nom}</span>
                        <span className="text-sm text-muted-foreground">
                          {tech.heures}h / {tech.objectif}h
                        </span>
                      </div>
                      <Progress 
                        value={(tech.heures / tech.objectif) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temps par type d'opération</CardTitle>
                <CardDescription>
                  Répartition des heures ce mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { operation: 'Découpe', heures: 124, couleur: 'bg-blue-500' },
                    { operation: 'Soudure', heures: 186, couleur: 'bg-green-500' },
                    { operation: 'Pliage', heures: 98, couleur: 'bg-yellow-500' },
                    { operation: 'Finition', heures: 72, couleur: 'bg-purple-500' },
                    { operation: 'Assemblage', heures: 156, couleur: 'bg-orange-500' },
                  ].map((op, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{op.operation}</span>
                        <span className="text-sm font-medium">{op.heures}h</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", op.couleur)}
                          style={{ width: `${(op.heures / 636) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}