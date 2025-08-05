'use client'

import { Button } from '@erp/ui/primitives'
import { AlertCircle, Building, LogOut, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/hooks'
import { getTabId } from '@/lib/tab-id'

interface TabSyncNotificationProps {
  // Optionnel : permettre de désactiver les notifications
  enabled?: boolean
}

export default function TabSyncNotification({ enabled = true }: TabSyncNotificationProps) {
  const { company, user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [_lastCompanyId, setLastCompanyId] = useState<string | null>(null)
  const [_lastUserId, setLastUserId] = useState<string | null>(null)

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
                  <p className="font-medium">{t('tabSync.societyChanged')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('tabSync.nowConnectedTo')} <strong>{data.company.nom}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('tabSync.refreshToSync')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('actions.refresh')}
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
                  <p className="font-medium">{t('tabSync.disconnected')}</p>
                  <p className="text-sm text-muted-foreground">{t('tabSync.logoutInOtherTab')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="ml-2"
                >
                  {t('tabSync.reconnection')}
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
                  <p className="font-medium">{t('tabSync.connectionDetected')}</p>
                  <p className="text-sm text-muted-foreground">{t('tabSync.loginInOtherTab')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('actions.refresh')}
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
  }, [enabled, company, isAuthenticated, router, t])

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
