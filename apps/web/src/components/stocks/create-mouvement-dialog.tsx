'use client'

import { Button } from "@erp/ui"
import { useState } from 'react'

interface CreateMouvementDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateMouvementDialog({ open, onOpenChange }: CreateMouvementDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Nouveau Mouvement</h2>
        <p className="text-muted-foreground mb-4">Fonctionnalité en cours de développement</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}




