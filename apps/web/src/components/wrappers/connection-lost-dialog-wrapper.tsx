'use client'

import { ConnectionLostDialog } from '@erp/ui'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/hooks'

interface ConnectionLostDialogWrapperProps {
  isOpen: boolean
  onRetry?: () => void | Promise<void>
}

export function ConnectionLostDialogWrapper({ isOpen, onRetry }: ConnectionLostDialogWrapperProps) {
  const router = useRouter()
  const { t } = useTranslation('common')

  const handleGoToLogin = () => {
    router?.push('/login')
  }

  const translations = {
    title: t('connection.lost.title'),
    connectionInterrupted: t('connection.lost.connectionInterrupted'),
    possibleReasons: t('connection.lost.possibleReasons'),
    serverRestart: t('connection.lost.serverRestart'),
    networkLoss: t('connection.lost.networkLoss'),
    sessionExpired: t('connection.lost.sessionExpired'),
    retrying: t('connection.lost.retrying'),
    retry: t('connection.lost.retry'),
    backToLogin: t('connection.lost.backToLogin'),
    contactAdmin: t('connection.lost.contactAdmin'),
  }

  return (
    <ConnectionLostDialog
      isOpen={isOpen}
      onRetry={onRetry}
      onGoToLogin={handleGoToLogin}
      translations={translations}
    />
  )
}
