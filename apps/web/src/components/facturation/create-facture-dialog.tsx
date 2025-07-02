// apps/web/src/components/facturation/create-facture-dialog.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useState } from 'react'

interface CreateFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFactureCreated?: (facture: any) => void
}

export function CreateFactureDialog({ onFactureCreated }: CreateFactureDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulation création facture
    setTimeout(() => {
      const newFacture = {
        id: `FACTURE-${Date.now()}`,
        reference: `FAC-${Math.floor(Math.random() * 1000)}`,
        clientId: 'client-1',
        montantHT: 0,
        statut: 'brouillon'
      }
      
      onFactureCreated?.(newFacture)
      setLoading(false)
      setOpen(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Facture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle facture</DialogTitle>
          <DialogDescription>
            Saisissez les informations de base pour créer une nouvelle facture.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">
              Référence
            </Label>
            <Input
              id="reference"
              placeholder="FAC-001"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">
              Client
            </Label>
            <Input
              id="client"
              placeholder="Nom du client"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Type de facture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vente">Facture de vente</SelectItem>
                <SelectItem value="acompte">Facture d'acompte</SelectItem>
                <SelectItem value="avoir">Avoir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
