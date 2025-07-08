import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/navigation/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/layout/card'

const meta: Meta<typeof Tabs> = {
  title: '04-Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Système d'onglets pour organiser le contenu dans TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta

export const Default = () => (
  <Tabs defaultValue="informations" className="w-[400px]">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="informations">Informations</TabsTrigger>
      <TabsTrigger value="production">Production</TabsTrigger>
      <TabsTrigger value="facturation">Facturation</TabsTrigger>
    </TabsList>
    <TabsContent value="informations">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Détails du projet et informations client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Nom: Hangar Agricole 2024</p>
          <p>Client: Ferme Martin</p>
          <p>Référence: PRJ-2024-001</p>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="production">
      <Card>
        <CardHeader>
          <CardTitle>Suivi production</CardTitle>
          <CardDescription>État d'avancement et planning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Statut: En cours</p>
          <p>Avancement: 65%</p>
          <p>Échéance: 15 mars 2024</p>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="facturation">
      <Card>
        <CardHeader>
          <CardTitle>Informations de facturation</CardTitle>
          <CardDescription>Devis, factures et paiements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Montant HT: 45 000 €</p>
          <p>TVA: 9 000 €</p>
          <p>Total TTC: 54 000 €</p>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
)

export const ProjetTabs = () => (
  <Tabs defaultValue="overview" className="w-[600px]">
    <TabsList>
      <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
      <TabsTrigger value="planning">Planning</TabsTrigger>
      <TabsTrigger value="documents">Documents</TabsTrigger>
      <TabsTrigger value="equipe">Équipe</TabsTrigger>
    </TabsList>
    
    <TabsContent value="overview" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget utilisé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ 29k</div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
    
    <TabsContent value="planning">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Étude technique</span>
              <span className="text-green-600">✓ Terminé</span>
            </div>
            <div className="flex justify-between">
              <span>Fabrication structure</span>
              <span className="text-blue-600">🔄 En cours</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span className="text-gray-400">⏳ Planifié</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
    
    <TabsContent value="documents">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Devis initial</span>
              <span className="text-blue-600 cursor-pointer">Télécharger</span>
            </div>
            <div className="flex justify-between">
              <span>Plans techniques</span>
              <span className="text-blue-600 cursor-pointer">Voir</span>
            </div>
            <div className="flex justify-between">
              <span>Bon de commande</span>
              <span className="text-blue-600 cursor-pointer">Télécharger</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
    
    <TabsContent value="equipe">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
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
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
)
