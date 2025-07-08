'use client'

import { Button } from "@erp/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui"
import { Input } from "@erp/ui"
import { Label } from "@erp/ui"
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

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Nouveau devis:', formData)
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
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference: (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                    })
                  }
                  placeholder="DEV-2025-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateValidite">Date de validité</Label>
                <Input
                  id="dateValidite"
                  type="date"
                  value={formData.dateValidite}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateValidite: (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clientNom">Client *</Label>
              <Input
                id="clientNom"
                value={formData.clientNom}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientNom: (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                  })
                }
                placeholder="Nom du client ou entreprise"
                required
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Email client</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientEmail: (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                  })
                }
                placeholder="client@exemple.fr"
              />
            </div>

            <div>
              <Label htmlFor="description">Description du projet</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: (e.target as HTMLInputElement | HTMLTextAreaElement).value,
                  })
                }
                placeholder="Description des travaux de métallerie..."
                className="w-full p-2 border rounded-md min-h-[100px] resize-y"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
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




