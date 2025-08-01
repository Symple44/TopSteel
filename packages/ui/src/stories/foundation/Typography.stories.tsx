import type { Meta } from '@storybook/react'

const meta: Meta = {
  title: '01-Foundation/Typography',
  parameters: {
    docs: {
      description: {
        component: 'Système typographique TopSteel ERP',
      },
    },
  },
}

export default meta

export const Headings = () => (
  <div className="space-y-4">
    <h1 className="text-4xl font-bold">Heading 1 - Titre Principal</h1>
    <h2 className="text-3xl font-semibold">Heading 2 - Section</h2>
    <h3 className="text-2xl font-semibold">Heading 3 - Sous-section</h3>
    <h4 className="text-xl font-medium">Heading 4 - Titre</h4>
    <h5 className="text-lg font-medium">Heading 5 - Sous-titre</h5>
    <h6 className="text-base font-medium">Heading 6 - Label</h6>
  </div>
)

export const BodyText = () => (
  <div className="space-y-4">
    <p className="text-base">Corps de texte standard pour la lecture courante dans l'ERP.</p>
    <p className="text-sm text-muted-foreground">
      Texte secondaire pour les informations complémentaires.
    </p>
    <p className="text-xs text-muted-foreground">Petits textes pour les détails et métadonnées.</p>
  </div>
)
