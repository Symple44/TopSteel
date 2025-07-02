'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Interface correcte avec open et onOpenChange
interface CreatePaiementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaiementCreated?: (paiement: any) => void
}

export function CreatePaiementDialog({ 
  open, 
  onOpenChange, 
  onPaiementCreated 
}: CreatePaiementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    montant: '',
    methode: 'virement',
    reference: '',
    dateReception: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulation création paiement
    setTimeout(() => {
      const newPaiement = {
        id: `PAIEMENT-${Date.now()}`,
        montant: parseFloat(formData.montant),
        methode: formData.methode,
        reference: formData.reference,
        dateReception: formData.dateReception,
        statut: 'valide'
      }
      
      onPaiementCreated?.(newPaiement)
      setLoading(false)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        montant: '',
        methode: 'virement',
        reference: '',
        dateReception: new Date().toISOString().split('T')[0]
      })
    }, 1000)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Saisissez les informations du paiement reçu.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="montant" className="text-right">
              Montant
            </Label>
            <Input 
              id="montant" 
              type="number" 
              step="0.01"
              className="col-span-3"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: (e.target as HTMLInputElement).value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">
              Référence
            </Label>
            <Input 
              id="reference" 
              className="col-span-3"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: (e.target as HTMLInputElement).value })}
              placeholder="Numéro de référence"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateReception" className="text-right">
              Date
            </Label>
            <Input 
              id="dateReception" 
              type="date"
              className="col-span-3"
              value={formData.dateReception}
              onChange={(e) => setFormData({ ...formData, dateReception: (e.target as HTMLInputElement).value })}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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