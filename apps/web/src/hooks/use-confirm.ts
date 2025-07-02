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
  resolve?: (value: boolean) => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: {},
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
    setState(prev => ({ ...prev, isOpen: false, resolve: undefined }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState(prev => ({ ...prev, isOpen: false, resolve: undefined }))
  }

  return {
    confirm,
    isOpen: state.isOpen,
    options: state.options,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  }
}
