'use client'

import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../primitives/dialog'

interface ConnectionLostDialogProps {
  isOpen: boolean
  onRetry?: () => void | Promise<void>
  onGoToLogin?: () => void
  translations?: {
    title?: string
    connectionInterrupted?: string
    possibleReasons?: string
    serverRestart?: string
    networkLoss?: string
    sessionExpired?: string
    retrying?: string
    retry?: string
    backToLogin?: string
    contactAdmin?: string
  }
}

export function ConnectionLostDialog({
  isOpen,
  onRetry,
  onGoToLogin,
  translations = {},
}: ConnectionLostDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const t = {
    title: translations.title || 'Connexion perdue',
    connectionInterrupted:
      translations.connectionInterrupted || 'La connexion avec le serveur a été interrompue.',
    possibleReasons: translations.possibleReasons || 'Cela peut être dû à :',
    serverRestart: translations.serverRestart || 'Un redémarrage du serveur',
    networkLoss: translations.networkLoss || 'Une perte de connexion réseau',
    sessionExpired: translations.sessionExpired || 'Une session expirée',
    retrying: translations.retrying || 'Reconnexion en cours...',
    retry: translations.retry || 'Réessayer',
    backToLogin: translations.backToLogin || 'Retour à la connexion',
    contactAdmin:
      translations.contactAdmin ||
      'Si le problème persiste, contactez votre administrateur système.',
  }

  const handleRetry = async () => {
    setIsRetrying(true)

    try {
      // Si une fonction de retry est fournie, l'utiliser
      if (onRetry) {
        await onRetry()
      } else {
        // Sinon, recharger la page
        window.location.reload()
      }
    } catch (_error) {
      // En cas d'échec, recharger la page après un délai
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoToLogin = () => {
    if (onGoToLogin) {
      onGoToLogin()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <WifiOff className="h-6 w-6" />
            <DialogTitle className="text-xl">{t.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-3 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">{t.connectionInterrupted}</p>
                <p className="text-muted-foreground">{t.possibleReasons}</p>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>{t.serverRestart}</li>
                  <li>{t.networkLoss}</li>
                  <li>{t.sessionExpired}</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button type="button" onClick={handleRetry} disabled={isRetrying} className="w-full">
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.retrying}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.retry}
              </>
            )}
          </Button>

          {onGoToLogin && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGoToLogin}
              disabled={isRetrying}
              className="w-full"
            >
              {t.backToLogin}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">{t.contactAdmin}</p>
      </DialogContent>
    </Dialog>
  )
}
