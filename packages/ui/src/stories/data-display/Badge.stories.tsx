import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../../components/data-display/badge'

const meta: Meta<typeof Badge> = {
  title: '05-Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badges pour afficher des statuts et labels dans TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Variants = () => (
  <div className="flex space-x-2">
    <Badge>Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
)

// Statuts projet ERP
export const ProjetStatuts = () => (
  <div className="space-y-4">
    <div>
      <h4 className="mb-2 font-medium">Statuts de Projet</h4>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-blue-500">Nouveau</Badge>
        <Badge className="bg-yellow-500">En étude</Badge>
        <Badge className="bg-green-500">En cours</Badge>
        <Badge className="bg-orange-500">En pause</Badge>
        <Badge variant="destructive">Annulé</Badge>
        <Badge className="bg-gray-500">Terminé</Badge>
      </div>
    </div>
    
    <div>
      <h4 className="mb-2 font-medium">Priorités</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Basse</Badge>
        <Badge variant="secondary">Normal</Badge>
        <Badge className="bg-orange-500">Haute</Badge>
        <Badge variant="destructive">Urgente</Badge>
      </div>
    </div>
    
    <div>
      <h4 className="mb-2 font-medium">Types de Projet</h4>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-purple-500">Hangar</Badge>
        <Badge className="bg-cyan-500">Structure</Badge>
        <Badge className="bg-indigo-500">Garde-corps</Badge>
        <Badge className="bg-pink-500">Escalier</Badge>
      </div>
    </div>
    
    <div>
      <h4 className="mb-2 font-medium">Statuts Commande</h4>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-yellow-600">En attente</Badge>
        <Badge className="bg-blue-600">Validée</Badge>
        <Badge className="bg-green-600">Livrée</Badge>
        <Badge variant="destructive">Retournée</Badge>
      </div>
    </div>
  </div>
)

export const WithNumbers = () => (
  <div className="flex space-x-2">
    <Badge>Nouveau 3</Badge>
    <Badge variant="destructive">En retard 2</Badge>
    <Badge className="bg-green-500">Terminé 15</Badge>
  </div>
)
