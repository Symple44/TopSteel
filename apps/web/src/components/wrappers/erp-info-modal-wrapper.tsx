'use client'

import { ErpInfoModal, type ErpInfoModalProps } from '@erp/ui/business'
import { useBackendHealth } from '@/hooks/use-backend-health'
import { useTranslation } from '@/lib/i18n'

interface ErpInfoModalWrapperProps
  extends Omit<ErpInfoModalProps, 'health' | 'onCheckHealth' | 'isChecking' | 'translations'> {
  // Override props that we'll handle internally
}

export function ErpInfoModalWrapper(props: ErpInfoModalWrapperProps) {
  const { health, checkHealth, isChecking } = useBackendHealth()
  const { t } = useTranslation('common')

  const translations = {
    title: 'TopSteel ERP',
    systemInfo: 'Informations système',
    serverStatus: 'Statut du serveur',
    refresh: 'Actualiser',
    checking: 'Vérification...',
    online: 'En ligne',
    offline: 'Hors ligne',
    error: 'Erreur',
    unknown: 'Inconnu',
    detailedInfo: 'Informations détaillées',
    version: 'Version',
    environment: 'Environnement',
    database: 'Base de données',
    connected: 'Connectée',
    disconnected: 'Déconnectée',
    unknown_db: 'Inconnue',
    connectedUsers: 'Utilisateurs connectés',
    uptime: 'Temps de fonctionnement',
    lastCheck: 'Dernière vérification',
    errorLabel: 'Erreur:',
    trademark: 'TopSteel© ERP',
    tagline: 'Solide comme votre savoir-faire',
  }

  return (
    <ErpInfoModal
      {...props}
      health={health}
      onCheckHealth={checkHealth}
      isChecking={isChecking}
      translations={translations}
    />
  )
}

export default ErpInfoModalWrapper
