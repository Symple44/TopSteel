import type { Meta } from '@storybook/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/layout/card'
import { Badge } from '../../components/data-display/badge'
import { Button } from '../../components/primitives/button'
import { Progress } from '../../components/data-display/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/navigation/tabs'

const meta: Meta = {
  title: '08-ERP Patterns/Dashboard',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Patterns de dashboard pour TopSteel ERP',
      },
    },
  },
}

export default meta

export const DashboardOverview = () => (
  <div className="p-6 space-y-6">
    {/* KPIs */}
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 ce mois</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">En retard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">3</div>
          <p className="text-xs text-muted-foreground">Action requise</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">CA du mois</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€ 125k</div>
          <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">Validation requise</p>
        </CardContent>
      </Card>
    </div>

    {/* Projets récents */}
    <Card>
      <CardHeader>
        <CardTitle>Projets récents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { nom: "Hangar Agricole 2024", client: "Ferme Martin", statut: "En cours", avancement: 65, badge: "bg-green-500" },
            { nom: "Structure Industrielle", client: "SARL Transport", statut: "En retard", avancement: 30, badge: "bg-red-500" },
            { nom: "Garde-corps Résidentiel", client: "Particulier", statut: "Nouveau", avancement: 5, badge: "bg-blue-500" },
          ].map((projet, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{projet.nom}</h4>
                  <Badge className={projet.badge}>{projet.statut}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{projet.client}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avancement</span>
                    <span>{projet.avancement}%</span>
                  </div>
                  <Progress value={projet.avancement} className="h-2" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="ml-4">
                Voir détails
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

export const ProjetDetailPattern = () => (
  <div className="p-6">
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Hangar Agricole 2024</h1>
          <p className="text-muted-foreground">PRJ-2024-001 • Client: Ferme Martin</p>
        </div>
        <div className="flex space-x-2">
          <Badge className="bg-green-500">En cours</Badge>
          <Button variant="outline">Modifier</Button>
          <Button>Actions</Button>
        </div>
      </div>
    </div>

    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="production">Production</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="facturation">Facturation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progression globale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">65%</div>
              <Progress value={65} className="mb-2" />
              <p className="text-sm text-muted-foreground">En avance de 2 jours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">€ 29k</div>
              <p className="text-sm text-muted-foreground">sur € 45k budget</p>
              <Progress value={64} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Échéance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">15 Mars</div>
              <p className="text-sm text-muted-foreground">Dans 12 jours</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Raison sociale:</span>
                <span>EARL Ferme Martin</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contact:</span>
                <span>Pierre Martin</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Téléphone:</span>
                <span>01 23 45 67 89</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>p.martin@ferme-martin.fr</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Équipe projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  JD
                </div>
                <div>
                  <p className="font-medium">Jean Dupont</p>
                  <p className="text-sm text-gray-500">Chef de projet</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  ML
                </div>
                <div>
                  <p className="font-medium">Marie Lambert</p>
                  <p className="text-sm text-gray-500">Responsable production</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  </div>
)



