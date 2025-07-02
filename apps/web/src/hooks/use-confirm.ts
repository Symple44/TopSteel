'use client'

import { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook pour utiliser facilement les confirmations
export function useConfirm() {
  const [dialogs, setDialogs] = useState<Array<{
    id: string
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void | Promise<void>
  }>>([])

  const confirm = useCallback((options: Omit<typeof dialogs[0], 'id'>) => {
    return new Promise<boolean>((resolve) => {
      const id = Math.random().toString(36).substr(2, 9)
      setDialogs(prev => [...prev, {
        ...options,
        id,
        onConfirm: async () => {
          await options.onConfirm()
          setDialogs(prev => prev.filter(d => d.id !== id))
          resolve(true)
        }
      }])
    })
  }, [])

  const closeDialog = useCallback((id: string) => {
    setDialogs(prev => prev.filter(d => d.id !== id))
  }, [])

  const ConfirmDialogs = useCallback(() => (
    <>
      {dialogs.map(dialog => (
        <ConfirmDialog
          key={dialog.id}
          open={true}
          onOpenChange={() => closeDialog(dialog.id)}
          title={dialog.title}
          description={dialog.description}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          variant={dialog.variant}
          onConfirm={dialog.onConfirm}
        />
      ))}
    </>
  ), [dialogs, closeDialog])

  return { confirm, ConfirmDialogs }
}