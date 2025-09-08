'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  useFormFieldIds,
} from '@erp/ui'
import { useState } from 'react'

// Interface correcte avec open et onOpenChange
interface CreatePaiementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaiementCreated?: (paiement: unknown) => void
}

export function CreatePaiementDialog({
  open,
  onOpenChange,
  onPaiementCreated,
}: CreatePaiementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    methode: 'virement',
    reference: '',
    dateReception: new Date().toISOString().split('T')[0],
  })

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds(['montant', 'reference', 'dateReception'])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)

    // Simulation création paiement
    setTimeout(() => {
      const newPaiement = {
        id: `PAIEMENT-${Date.now()}`,
        montant: Number?.parseFloat(formData.montant),
        methode: formData.methode,
        reference: formData.reference,
        dateReception: formData.dateReception,
        statut: 'valide',
      }

      onPaiementCreated?.(newPaiement)
      setLoading(false)
      onOpenChange(false)

      // Reset form
      setFormData({
        montant: '',
        methode: 'virement',
        reference: '',
        dateReception: new Date().toISOString().split('T')[0],
      })
    }, 1000)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>Saisissez les informations du paiement reçu.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={fieldIds.montant} className="text-right">
              Montant
            </Label>
            <Input
              id={fieldIds.montant}
              type="number"
              step="0.01"
              className="col-span-3"
              value={formData.montant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, montant: e?.target?.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={fieldIds.reference} className="text-right">
              Référence
            </Label>
            <Input
              id={fieldIds.reference}
              className="col-span-3"
              value={formData.reference}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, reference: e?.target?.value })
              }
              placeholder="Numéro de référence"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={fieldIds.dateReception} className="text-right">
              Date
            </Label>
            <Input
              id={fieldIds.dateReception}
              type="date"
              className="col-span-3"
              value={formData.dateReception}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, dateReception: e?.target?.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
