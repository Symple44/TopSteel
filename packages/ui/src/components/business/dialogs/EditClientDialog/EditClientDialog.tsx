'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../feedback'
import {
  Button,
} from '../../../primitives'

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: unknown) => void
}

export function EditClientDialog({ open, onOpenChange, onSubmit }: EditClientDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement Modifier un client logic
    setTimeout(() => {
      onSubmit?.({})
      setLoading(false)
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier un client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TODO: Add form fields */}
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'En cours...' : 'Valider'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
