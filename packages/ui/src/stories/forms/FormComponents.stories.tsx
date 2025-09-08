import type { Meta } from '@storybook/react'
import { useId } from 'react'
import { Label } from '../../components/forms/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/layout/card'
import { Button } from '../../components/primitives/button'
import { Checkbox } from '../../components/primitives/checkbox'
import { Input } from '../../components/primitives/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/primitives/select'
import { Textarea } from '../../components/primitives/textarea'

const meta: Meta = {
  title: '07-Forms/Form Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composants de formulaires pour TopSteel ERP',
      },
    },
  },
}

export default meta

export const ProjetForm = () => {
  const nomId = useId()
  const referenceId = useId()
  const dateDebutId = useId()
  const dateFinId = useId()
  const budgetId = useId()
  const descriptionId = useId()
  const urgentId = useId()

  return (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Créer un nouveau projet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={nomId}>Nom du projet *</Label>
            <Input id={nomId} placeholder="Ex: Hangar agricole 2024" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={referenceId}>Référence</Label>
            <Input id={referenceId} placeholder="PRJ-2024-001" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ferme-martin">Ferme Martin</SelectItem>
              <SelectItem value="transport-abc">SARL Transport ABC</SelectItem>
              <SelectItem value="industrie-xyz">Industries XYZ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de projet</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hangar">Hangar</SelectItem>
                <SelectItem value="structure">Structure métallique</SelectItem>
                <SelectItem value="garde-corps">Garde-corps</SelectItem>
                <SelectItem value="escalier">Escalier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priorite">Priorité</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={dateDebutId}>Date de début</Label>
            <Input id={dateDebutId} type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={dateFinId}>Date de fin prévue</Label>
            <Input id={dateFinId} type="date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={budgetId}>Budget prévisionnel (€ HT)</Label>
          <Input id={budgetId} type="number" placeholder="45000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>Description</Label>
          <Textarea id={descriptionId} placeholder="Description détaillée du projet..." rows={3} />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id={urgentId} />
          <Label htmlFor={urgentId}>Projet urgent nécessitant un suivi particulier</Label>
        </div>

        <div className="flex space-x-2">
          <Button type="submit">Créer le projet</Button>
          <Button variant="outline">Annuler</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const ClientForm = () => {
  const raisonSocialeId = useId()
  const siretId = useId()
  const tvaId = useId()
  const adresseId = useId()
  const contactId = useId()
  const emailId = useId()
  const telephoneId = useId()

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Nouveau client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={raisonSocialeId}>Raison sociale *</Label>
          <Input id={raisonSocialeId} placeholder="Ex: SARL Martin" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={siretId}>SIRET</Label>
            <Input id={siretId} placeholder="12345678901234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={tvaId}>N° TVA</Label>
            <Input id={tvaId} placeholder="FR12345678901" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={adresseId}>Adresse</Label>
          <Textarea id={adresseId} placeholder="Adresse complète..." rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={contactId}>Contact principal</Label>
            <Input id={contactId} placeholder="Jean Martin" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} type="email" placeholder="contact@martin.fr" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={telephoneId}>Téléphone</Label>
          <Input id={telephoneId} type="tel" placeholder="01 23 45 67 89" />
        </div>

        <div className="flex space-x-2">
          <Button type="submit">Ajouter le client</Button>
          <Button variant="outline">Annuler</Button>
        </div>
      </CardContent>
    </Card>
  )
}
