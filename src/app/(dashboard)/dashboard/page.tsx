'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  FolderOpen, 
  Factory, 
  AlertTriangle,
  Calendar,
  Euro,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Données mockées pour la démonstration
const stats = [
  {
    label: 'Chiffre d\'affaires',
    value: '125 450 €',
    change: '+12.5%',
    trend: 'up',
    icon: Euro,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    label: 'Projets actifs',
    value: '12',
    change: '+2',
    trend: 'up',
    icon: FolderOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    label: 'En production',
    value: '5',
    change: '0',
    trend: 'neutral',
    icon: Factory,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    label: 'Stocks critiques',
    value: '3',
    change: '-1',
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
]

const recentProjects = [
  {
    id: 1,
    reference: 'PRJ-2025-0142',
    client: 'Entreprise ABC',
    description: 'Garde-corps et escalier métallique',
    statut: 'En cours',
    avancement: 65,
    montant: '45 250 €',
    dateEcheance: '2025-07-15',
  },
  {
    id: 2,
    reference: 'PRJ-2025-0141',
    client: 'Société XYZ',
    description: 'Structure métallique pour hangar',
    statut: 'Devis',
    avancement: 15,
    montant: '32 800 €',
    dateEcheance: '2025-06-30',
  },
  {
    id: 3,
    reference: 'PRJ-2025-0140',
    client: 'SARL Martin',
    description: 'Portail et clôture',
    statut: 'Production',
    avancement: 80,
    montant: '28 500 €',
    dateEcheance: '2025-06-25',
  },
]

const productionOrders = [
  {
    id: 1,
    numero: 'OF-2025-0089',
    projet: 'PRJ-2025-0140',
    operation: 'Découpe laser',
    progression: 100,
    statut: 'Terminé',
  },
  {
    id: 2,
    numero: 'OF-2025-0090',
    projet: 'PRJ-2025-0140',
    operation: 'Soudure assemblage',
    progression: 45,
    statut: 'En cours',
  },
  {
    id: 3,
    numero: 'OF-2025-0091',
    projet: 'PRJ-2025-0142',
    operation: 'Pliage tôles',
    progression: 0,
    statut: 'En attente',
  },
]

const chartData = [
  { name: 'Jan', ca: 95000, projets: 8 },
  { name: 'Fév', ca: 102000, projets: 10 },
  { name: 'Mar', ca: 98000, projets: 9 },
  { name: 'Avr', ca: 115000, projets: 12 },
  { name: 'Mai', ca: 108000, projets: 11 },
  { name: 'Juin', ca: 125450, projets: 12 },
]

const projectStatusData = [
  { name: 'Devis', value: 4, color: '#F59E0B' },
  { name: 'En cours', value: 5, color: '#3B82F6' },
  { name: 'Production', value: 2, color: '#8B5CF6' },
  { name: 'Terminé', value: 1, color: '#10B981' },
]

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : stat.trend === 'down' ? (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : ''
                  }>
                    {stat.change}
                  </span>
                  <span className="ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
            <CardDescription>
              Chiffre d'affaires mensuel sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des projets</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {projectStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projets récents</TabsTrigger>
          <TabsTrigger value="production">Ordres de production</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projets récents</CardTitle>
                <Button variant="outline" size="sm">
                  Voir tous les projets
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold">{project.reference}</h4>
                        <Badge
                          variant={
                            project.statut === 'En cours' ? 'default' :
                            project.statut === 'Devis' ? 'secondary' :
                            project.statut === 'Production' ? 'outline' :
                            'default'
                          }
                        >
                          {project.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.client} - {project.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(project.dateEcheance).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Euro className="h-3 w-3" />
                          <span>{project.montant}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Avancement</span>
                        <span className="font-medium">{project.avancement}%</span>
                      </div>
                      <Progress value={project.avancement} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ordres de production en cours</CardTitle>
                <Button variant="outline" size="sm">
                  Voir tous les ordres
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold">{order.numero}</h4>
                        <Badge
                          variant={
                            order.statut === 'En cours' ? 'default' :
                            order.statut === 'Terminé' ? 'secondary' :
                            'outline'
                          }
                        >
                          {order.statut === 'En cours' && (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {order.statut === 'Terminé' && (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          {order.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.projet} - {order.operation}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{order.progression}%</span>
                      </div>
                      <Progress 
                        value={order.progression} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}