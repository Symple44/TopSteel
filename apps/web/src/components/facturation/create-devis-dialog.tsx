'use client'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import { X } from 'lucide-react'
import { useState } from 'react'

interface CreateDevisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDevisDialog({ open, onOpenChange }: CreateDevisDialogProps) {
  const [formData, setFormData] = useState({
    reference: '',
    clientNom: '',
    clientEmail: '',
    description: '',
    dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
  })

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds([
    'reference',
    'dateValidite',
    'clientNom',
    'clientEmail',
    'description',
  ])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e?.preventDefault()
    onOpenChange(false)
    setFormData({
      reference: '',
      clientNom: '',
      clientEmail: '',
      description: '',
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Créer un nouveau devis</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={fieldIds.reference}>Référence *</Label>
                <Input
                  id={fieldIds.reference}
                  value={formData.reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      reference: e?.target?.value,
                    })
                  }
                  placeholder="DEV-2025-001"
                />
              </div>
              <div>
                <Label htmlFor={fieldIds.dateValidite}>Date de validité</Label>
                <Input
                  id={fieldIds.dateValidite}
                  type="date"
                  value={formData.dateValidite}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      dateValidite: e?.target?.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor={fieldIds.clientNom}>Client *</Label>
              <Input
                id={fieldIds.clientNom}
                value={formData.clientNom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    clientNom: e?.target?.value,
                  })
                }
                placeholder="Nom du client ou entreprise"
              />
            </div>

            <div>
              <Label htmlFor={fieldIds.clientEmail}>Email client</Label>
              <Input
                id={fieldIds.clientEmail}
                type="email"
                value={formData.clientEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    clientEmail: e?.target?.value,
                  })
                }
                placeholder="client@exemple.fr"
              />
            </div>

            <div>
              <Label htmlFor={fieldIds.description}>Description du projet</Label>
              <Textarea
                id={fieldIds.description}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({
                    ...formData,
                    description: e?.target?.value,
                  })
                }
                placeholder="Description des travaux de métallerie..."
                className="w-full p-2 border rounded-md min-h-[100px] resize-y"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Créer le devis
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
