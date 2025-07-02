// apps/web/src/components/facturation/create-devis-dialog.tsx
'use client'

import { useState } from 'react'
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
import { Plus } from 'lucide-react'

interface CreateDevisDialogProps {
  onDevisCreated?: (devis: any) => void
}

export function CreateDevisDialog({ onDevisCreated }: CreateDevisDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulation création devis
    setTimeout(() => {
      const newDevis = {
        id: `DEVIS-${Date.now()}`,
        reference: `DEV-${Math.floor(Math.random() * 1000)}`,
        clientId: 'client-1',
        montantHT: 0,
        statut: 'brouillon'
      }
      
      onDevisCreated?.(newDevis)
      setLoading(false)
      setOpen(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Devis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau devis</DialogTitle>
          <DialogDescription>
            Saisissez les informations de base pour créer un nouveau devis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">
              Référence
            </Label>
            <Input
              id="reference"
              placeholder="DEV-001"
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
