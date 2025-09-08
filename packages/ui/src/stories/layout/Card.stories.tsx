import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../../components/data-display/badge'
import { Progress } from '../../components/data-display/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/layout/card'
import { Button } from '../../components/primitives/button'

const meta: Meta<typeof Card> = {
  title: '03-Layout/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Conteneur de contenu polyvalent pour TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Titre de la carte</CardTitle>
        <CardDescription>Description du contenu de cette carte.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Contenu principal de la carte.</p>
      </CardContent>
      <CardFooter>
        <Button type="button">Action</Button>
      </CardFooter>
    </Card>
  ),
}

// Cards ERP spécifiques
export const ProjetCard = () => (
  <Card className="w-80">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>Hangar Agricole 2024</CardTitle>
          <CardDescription>Client: Ferme Martin</CardDescription>
        </div>
        <Badge>En cours</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Avancement</span>
          <span>65%</span>
        </div>
        <Progress value={65} />
      </div>
      <div className="text-sm text-muted-foreground">
        <p>Échéance: 15 mars 2024</p>
        <p>Budget: 45 000 € HT</p>
      </div>
    </CardContent>
    <CardFooter className="flex space-x-2">
      <Button type="button" size="sm">
        Voir détails
      </Button>
      <Button type="button" variant="outline" size="sm">
        Modifier
      </Button>
    </CardFooter>
  </Card>
)

export const StatsCard = () => (
  <div className="grid grid-cols-3 gap-4">
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
  </div>
)

export const CommandeCard = () => (
  <Card className="w-96">
    <CardHeader>
      <div className="flex justify-between">
        <div>
          <CardTitle>Commande #CMD-2024-056</CardTitle>
          <CardDescription>Structure pour entrepôt</CardDescription>
        </div>
        <Badge variant="secondary">Validée</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex justify-between">
        <span className="font-medium">Client:</span>
        <span>SARL Transport ABC</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Montant:</span>
        <span className="font-bold">78 500 € HT</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Livraison:</span>
        <span>28 février 2024</span>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button type="button" variant="outline" size="sm">
        Télécharger PDF
      </Button>
      <Button type="button" size="sm">
        Lancer production
      </Button>
    </CardFooter>
  </Card>
)
