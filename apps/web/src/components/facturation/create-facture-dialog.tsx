;('use client')

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'

import { Plus } from 'lucide-react'
import { useState } from 'react'

interface CreateFactureDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onFactureCreated?: (facture: unknown) => void
}

export function CreateFactureDialog({ onFactureCreated }: CreateFactureDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reference: '',
    client: '',
    type: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client - maintient la robustesse
    if (!formData.reference.trim()) {
      alert('La référence est obligatoire')

      return
    }
    if (!formData.client.trim()) {
      alert('Le client est obligatoire')

      return
    }
    if (!formData.type) {
      alert('Le type de facture est obligatoire')

      return
    }

    setLoading(true)

    // Simulation création facture
    setTimeout(() => {
      const newFacture = {
        id: `FACTURE-${Date.now()}`,
        reference: formData.reference,
        clientId: 'client-1',
        type: formData.type,
        montantHT: 0,
        statut: 'brouillon',
      }

      onFactureCreated?.(newFacture)
      setLoading(false)
      setOpen(false)

      // Reset form
      setFormData({ reference: '', client: '', type: '' })
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
              value={formData.reference}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, reference: e.target.value })
              }
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
              value={formData.client}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, client: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: string) => setFormData({ ...formData, type: value })}
            >
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
