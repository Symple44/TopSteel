// apps/web/src/hooks/use-confirm.ts
import { useState } from 'react'

interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null // Correction: null au lieu de undefined
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: {},
    resolve: null, // Correction: null au lieu de undefined
  })

  const confirm = (options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: {
          title: 'Confirmation',
          message: 'Êtes-vous sûr de vouloir continuer ?',
          confirmText: 'Confirmer',
          cancelText: 'Annuler',
          variant: 'default',
          ...options,
        },
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    state.resolve?.(true)
    setState(prev => ({ 
      ...prev, 
      isOpen: false, 
      resolve: null // Correction: null au lieu de undefined
    }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState(prev => ({ 
      ...prev, 
      isOpen: false, 
      resolve: null // Correction: null au lieu de undefined
    }))
  }

  const handleClose = () => {
    // Méthode alternative pour fermer sans décision
    state.resolve?.(false)
    setState(prev => ({ 
      ...prev, 
      isOpen: false, 
      resolve: null 
    }))
  }

  return {
    confirm,
    isOpen: state.isOpen,
    options: state.options,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    onClose: handleClose,
  }
}