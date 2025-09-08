import type { Meta, StoryObj } from '@storybook/react'
import { useId } from 'react'
import { Label } from '../../components/forms/label'
import { Input, type InputProps } from '../../components/primitives/input'

const meta: Meta<InputProps> = {
  title: '02-Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Champ de saisie pour les formulaires TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<InputProps>

export const Default: Story = {
  args: {
    placeholder: 'Saisir du texte...',
  },
}

export const WithLabel = () => {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Nom du projet</Label>
      <Input id={id} placeholder="Ex: Hangar agricole 2024" />
    </div>
  )
}

export const Required = () => {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Nom du client <span className="text-red-500">*</span>
      </Label>
      <Input id={id} placeholder="Nom obligatoire" required />
    </div>
  )
}

export const Disabled: Story = {
  args: {
    placeholder: 'Champ désactivé',
    disabled: true,
  },
}

export const WithError = () => {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        id={id}
        type="email"
        placeholder="email@exemple.com"
        className="border-red-500 focus:ring-red-500"
      />
      <p className="text-sm text-red-500">Format d'email invalide</p>
    </div>
  )
}

// Types spécifiques ERP
export const ERPInputTypes = () => (
  <div className="space-y-6 w-80">
    <div className="space-y-2">
      <Label>Référence Projet</Label>
      <Input placeholder="PRJ-2024-001" />
    </div>
    <div className="space-y-2">
      <Label>Montant HT (€)</Label>
      <Input type="number" placeholder="25000.00" />
    </div>
    <div className="space-y-2">
      <Label>Date d'échéance</Label>
      <Input type="date" />
    </div>
    <div className="space-y-2">
      <Label>Description technique</Label>
      <Input placeholder="Structure métallique pour hangar..." />
    </div>
  </div>
)
