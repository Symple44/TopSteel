import type { Meta } from '@storybook/react'
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

export const ProjetForm = () => (
  <Card className="w-[500px]">
    <CardHeader>
      <CardTitle>Créer un nouveau projet</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du projet *</Label>
          <Input id="nom" placeholder="Ex: Hangar agricole 2024" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">Référence</Label>
          <Input id="reference" placeholder="PRJ-2024-001" />
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
          <Label htmlFor="date-debut">Date de début</Label>
          <Input id="date-debut" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-fin">Date de fin prévue</Label>
          <Input id="date-fin" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget prévisionnel (€ HT)</Label>
        <Input id="budget" type="number" placeholder="45000" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Description détaillée du projet..." rows={3} />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="urgent" />
        <Label htmlFor="urgent">Projet urgent nécessitant un suivi particulier</Label>
      </div>

      <div className="flex space-x-2">
        <Button type="submit">Créer le projet</Button>
        <Button variant="outline">Annuler</Button>
      </div>
    </CardContent>
  </Card>
)

export const ClientForm = () => (
  <Card className="w-[400px]">
    <CardHeader>
      <CardTitle>Nouveau client</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="raison-sociale">Raison sociale *</Label>
        <Input id="raison-sociale" placeholder="Ex: SARL Martin" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="siret">SIRET</Label>
          <Input id="siret" placeholder="12345678901234" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tva">N° TVA</Label>
          <Input id="tva" placeholder="FR12345678901" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adresse">Adresse</Label>
        <Textarea id="adresse" placeholder="Adresse complète..." rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact">Contact principal</Label>
          <Input id="contact" placeholder="Jean Martin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="contact@martin.fr" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input id="telephone" type="tel" placeholder="01 23 45 67 89" />
      </div>

      <div className="flex space-x-2">
        <Button type="submit">Ajouter le client</Button>
        <Button variant="outline">Annuler</Button>
      </div>
    </CardContent>
  </Card>
)
