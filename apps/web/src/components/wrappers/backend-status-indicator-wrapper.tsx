'use client'

import { BackendStatusIndicator, BackendConnectionGuard } from '@erp/ui'
import { useBackendHealth } from '@/hooks/use-backend-health'
import { useTranslation } from '@/lib/i18n/hooks'
import type React from 'react'

interface BackendStatusIndicatorWrapperProps {
  showDetails?: boolean
  className?: string
}

export function BackendStatusIndicatorWrapper({
  showDetails = false,
  className = '',
}: BackendStatusIndicatorWrapperProps) {
  const { health, checkHealth } = useBackendHealth()
  const { t } = useTranslation('common')

  const translations = {
    online: t('backend.status.online'),
    offline: t('backend.status.offline'),
    error: t('backend.status.error'),
    checking: t('backend.status.checking'),
    retry: t('backend.status.retry'),
    available: t('backend.status.available'),
  }

  return (
    <BackendStatusIndicator
      showDetails={showDetails}
      className={className}
      health={health}
      onRetry={checkHealth}
      translations={translations}
    />
  )
}

export function BackendConnectionGuardWrapper({ children }: { children: React.ReactNode }) {
  const { health } = useBackendHealth()
  const { t } = useTranslation('common')

  const translations = {
    connecting: t('backend.connecting'),
    checkingAvailability: t('backend.checkingAvailability'),
    serverUnavailable: t('backend.serverUnavailable'),
    serverUnavailableDesc: t('backend.serverUnavailableDesc'),
    toStartServer: t('backend.toStartServer'),
    attemptedUrl: t('backend.attemptedUrl'),
    lastCheck: t('backend.lastCheck'),
    never: t('backend.never'),
  }

  return (
    <BackendConnectionGuard
      health={health}
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
      translations={translations}
    >
      {children}
    </BackendConnectionGuard>
  )
}
