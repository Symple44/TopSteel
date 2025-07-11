'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../feedback'
import { Button } from '../../../primitives'

interface MaterialSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: unknown) => void
}

export function MaterialSelectorDialog({
  open,
  onOpenChange,
  onSubmit,
}: MaterialSelectorDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement Sélectionner un matériau logic
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
          <DialogTitle>Sélectionner un matériau</DialogTitle>
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
