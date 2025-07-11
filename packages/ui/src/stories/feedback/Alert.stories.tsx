import type { Meta, StoryObj } from '@storybook/react'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../components/feedback/alert'

const meta: Meta<typeof Alert> = {
  title: '06-Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alertes pour informer les utilisateurs dans TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta

export const Default = () => (
  <Alert className="w-96">
    <Info className="h-4 w-4" />
    <AlertTitle>Information</AlertTitle>
    <AlertDescription>
      Votre demande a été prise en compte et sera traitée sous 24h.
    </AlertDescription>
  </Alert>
)

export const Destructive = () => (
  <Alert variant="destructive" className="w-96">
    <XCircle className="h-4 w-4" />
    <AlertTitle>Erreur</AlertTitle>
    <AlertDescription>
      Impossible de sauvegarder le projet. Vérifiez votre connexion.
    </AlertDescription>
  </Alert>
)

// Alertes contexte ERP
export const ERPAlerts = () => (
  <div className="space-y-4 w-96">
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Projet validé</AlertTitle>
      <AlertDescription className="text-green-700">
        Le projet "Hangar Agricole 2024" a été validé et peut passer en production.
      </AlertDescription>
    </Alert>

    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Stock faible</AlertTitle>
      <AlertDescription className="text-yellow-700">
        Le stock de poutrelles IPE 200 est inférieur au seuil minimum (5 unités restantes).
      </AlertDescription>
    </Alert>

    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Retard de livraison</AlertTitle>
      <AlertDescription>
        La livraison du projet "Structure Industrielle" accuse 3 jours de retard.
      </AlertDescription>
    </Alert>

    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Nouveau devis</AlertTitle>
      <AlertDescription className="text-blue-700">
        Un nouveau devis (DEV-2024-089) nécessite votre validation.
      </AlertDescription>
    </Alert>
  </div>
)
