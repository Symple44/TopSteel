'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Loader2, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ConnectionLostDialogProps {
  isOpen: boolean
  onRetry?: () => void
}

export function ConnectionLostDialog({ isOpen, onRetry }: ConnectionLostDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const router = useRouter()

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
    } catch (error) {
      // En cas d'échec, recharger la page après un délai
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[425px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <WifiOff className="h-6 w-6" />
            <DialogTitle className="text-xl">Connexion perdue</DialogTitle>
          </div>
          <DialogDescription className="pt-3 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">La connexion avec le serveur a été interrompue.</p>
                <p className="text-muted-foreground">
                  Cela peut être dû à :
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>Un redémarrage du serveur</li>
                  <li>Une perte de connexion réseau</li>
                  <li>Une session expirée</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconnexion en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleGoToLogin}
            disabled={isRetrying}
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground pt-2">
          Si le problème persiste, contactez votre administrateur système.
        </p>
      </DialogContent>
    </Dialog>
  )
}