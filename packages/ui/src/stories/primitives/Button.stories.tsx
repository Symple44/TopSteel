import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../components/primitives/button'
import { Save, Download, Edit, Trash2, Plus } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: '02-Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant Button pour les actions dans TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// Variants de base
export const Default: Story = {
  args: {
    children: 'Bouton Principal',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Bouton Secondaire',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Supprimer',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Aperçu',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

// Tailles
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Petit',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Grand Bouton',
  },
}

// Avec icônes (contexte ERP)
export const WithIcons = () => (
  <div className="flex space-x-4">
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouveau Projet
    </Button>
    <Button variant="outline">
      <Edit className="mr-2 h-4 w-4" />
      Modifier
    </Button>
    <Button variant="secondary">
      <Download className="mr-2 h-4 w-4" />
      Exporter
    </Button>
    <Button variant="destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Supprimer
    </Button>
  </div>
)

// États
export const States = () => (
  <div className="space-y-4">
    <div className="flex space-x-4">
      <Button>Normal</Button>
      <Button disabled>Désactivé</Button>
    </div>
  </div>
)

// Cas d'usage ERP spécifiques
export const ERPActions = () => (
  <div className="space-y-4">
    <div>
      <h4 className="mb-2 font-medium">Actions Projet</h4>
      <div className="flex space-x-2">
        <Button><Plus className="mr-2 h-4 w-4" />Nouveau Projet</Button>
        <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Modifier</Button>
        <Button variant="secondary"><Save className="mr-2 h-4 w-4" />Sauvegarder</Button>
      </div>
    </div>
    <div>
      <h4 className="mb-2 font-medium">Actions Destructives</h4>
      <div className="flex space-x-2">
        <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer Projet</Button>
        <Button variant="destructive">Annuler Commande</Button>
      </div>
    </div>
  </div>
)



