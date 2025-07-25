'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Building, RefreshCw, LogOut, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { getTabId } from '@/lib/tab-id'

interface TabSyncNotificationProps {
  // Optionnel : permettre de désactiver les notifications
  enabled?: boolean
}

export default function TabSyncNotification({ enabled = true }: TabSyncNotificationProps) {
  const { company, user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [lastCompanyId, setLastCompanyId] = useState<string | null>(null)
  const [lastUserId, setLastUserId] = useState<string | null>(null)
  
  // Identifiant unique pour cet onglet (partagé globalement)
  const tabId = useRef<string>(getTabId())

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const channel = new BroadcastChannel('topsteel-auth')
    
    const handleMessage = (event: MessageEvent) => {
      const { type, data, tabId: senderTabId } = event.data
      
      // Ignorer les messages de notre propre onglet
      if (senderTabId === tabId.current) {
        return
      }
      
      switch (type) {
        case 'COMPANY_CHANGED':
          // Notifier seulement si on est sur une société différente
          if (data.company && company && data.company.id !== company.id) {
            toast.info(
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Société changée dans un autre onglet</p>
                  <p className="text-sm text-muted-foreground">
                    Maintenant connecté à <strong>{data.company.nom}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Actualisez pour synchroniser cet onglet
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Actualiser
                </Button>
              </div>,
              {
                duration: 8000,
                position: 'top-right',
              }
            )
          }
          break

        case 'USER_LOGOUT':
          if (isAuthenticated) {
            toast.error(
              <div className="flex items-center space-x-3">
                <LogOut className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium">Déconnecté</p>
                  <p className="text-sm text-muted-foreground">
                    Déconnexion effectuée dans un autre onglet
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="ml-2"
                >
                  Reconnexion
                </Button>
              </div>,
              {
                duration: 8000,
                position: 'top-right',
              }
            )
          }
          break

        case 'USER_LOGIN':
          if (!isAuthenticated) {
            toast.success(
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium">Connexion détectée</p>
                  <p className="text-sm text-muted-foreground">
                    Connexion effectuée dans un autre onglet
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Actualiser
                </Button>
              </div>,
              {
                duration: 6000,
                position: 'top-right',
              }
            )
          }
          break
      }
    }

    channel.addEventListener('message', handleMessage)
    
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [enabled, company, isAuthenticated, router])

  // Tracker les changements locaux pour éviter les notifications inutiles
  useEffect(() => {
    if (company) {
      setLastCompanyId(company.id)
    }
  }, [company])

  useEffect(() => {
    if (user) {
      setLastUserId(user.id)
    }
  }, [user])

  return null // Ce composant ne rend rien visuellement
}