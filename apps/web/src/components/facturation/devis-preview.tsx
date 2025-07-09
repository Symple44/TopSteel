// apps/web/src/components/facturation/devis-preview.tsx
'use client'

import {
  Card, CardContent, CardHeader, CardTitle
} from '@erp/ui'

interface DevisPreviewProps {
  devisId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DevisPreview({ devisId }: DevisPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aperçu Devis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Composant de prévisualisation des devis - ID: {devisId || 'N/A'}
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium">Fonctionnalités à implémenter :</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Affichage détaillé du devis</li>
            <li>• Export PDF</li>
            <li>• Validation/Signature</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}



