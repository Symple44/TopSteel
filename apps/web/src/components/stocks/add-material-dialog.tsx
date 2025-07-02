'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Package } from 'lucide-react'
import { useState } from 'react'

interface AddMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMaterialDialog({ open, onOpenChange }: AddMaterialDialogProps) {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    quantite: '',
    prixUnitaire: '',
    emplacement: '',
    seuil: ''
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onOpenChange(false)
    setFormData({ reference: '', designation: '', quantite: '', prixUnitaire: '', emplacement: '', seuil: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un matériau
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Référence *</label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                  placeholder="REF-001"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantité *</label>
                <Input
                  type="number"
                  value={formData.quantite}
                  onChange={(e) => setFormData({...formData, quantite: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                  placeholder="100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Désignation *</label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                placeholder="Acier S235 - Tôle 2mm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Prix unitaire</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.prixUnitaire}
                  onChange={(e) => setFormData({...formData, prixUnitaire: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                  placeholder="12.50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Seuil d'alerte</label>
                <Input
                  type="number"
                  value={formData.seuil}
                  onChange={(e) => setFormData({...formData, seuil: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Emplacement</label>
              <Input
                value={formData.emplacement}
                onChange={(e) => setFormData({...formData, emplacement: (e.target as HTMLInputElement | HTMLTextAreaElement).value})}
                placeholder="A1-B2-C3"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">Ajouter</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

