'use client'

import { ErpInfoModal } from '@erp/ui'
import { useBackendHealth } from '@/hooks/use-backend-health'
import { useTranslation } from '@/lib/i18n'

interface ErpInfoModalWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export function ErpInfoModalWrapper(props: ErpInfoModalWrapperProps) {
  const { health, checkHealth, isChecking } = useBackendHealth()
  const { t: _ } = useTranslation('common')

  // Convert null values to undefined for UI component compatibility
  const mappedHealth = {
    status: health.status,
    responseTime: health.responseTime ?? undefined,
    version: health.version ?? undefined,
    environment: health.environment ?? undefined,
    database: health.database === 'unknown' ? undefined : health.database,
    activeUsers: health.activeUsers,
    uptime: health.uptime ?? undefined,
    lastCheck: health.lastCheck ?? undefined,
    error: health.error,
  }

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
      isOpen={props.isOpen}
      onClose={props.onClose}
      health={mappedHealth}
      onCheckHealth={checkHealth}
      isChecking={isChecking}
      translations={translations}
    />
  )
}

export default ErpInfoModalWrapper
