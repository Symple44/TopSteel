'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../primitives'
import { useState } from 'react'

interface DeleteProjectConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: unknown) => void
}

export function DeleteProjectConfirmation({ open, onOpenChange, onSubmit }: DeleteProjectConfirmationProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement Confirmation suppression projet logic
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
          <DialogTitle>Confirmation suppression projet</DialogTitle>
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
