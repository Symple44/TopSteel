'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Server, Wifi } from 'lucide-react'
import { Button } from '@erp/ui'
import { BackendHealthService, BackendHealthStatus } from '@/lib/backend-health'
import { useTranslation } from '@/lib/i18n/hooks'

export default function BackendErrorPage() {
  const router = useRouter()
  const { t } = useTranslation('errors')
  const [status, setStatus] = useState<BackendHealthStatus>({
    isAvailable: false,
    status: 'checking',
    message: t('backend.checking'),
    lastCheck: new Date()
  })
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const service = BackendHealthService.getInstance()
    
    // S'abonner aux changements de statut
    const unsubscribe = service.subscribe((newStatus) => {
      setStatus(newStatus)
      
      // Si le backend devient disponible, rediriger vers le dashboard
      if (newStatus.isAvailable && newStatus.status === 'healthy') {
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    })

    // Vérifier immédiatement
    service.checkHealth()

    return unsubscribe
  }, [router])

  const handleRetry = async () => {
    setIsRetrying(true)
    const service = BackendHealthService.getInstance()
    
    try {
      await service.checkHealth()
    } finally {
      setIsRetrying(false)
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy': return 'text-green-600'
      case 'unhealthy': return 'text-red-600'
      case 'checking': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'healthy': return <Wifi className="h-8 w-8 text-green-600" />
      case 'unhealthy': return <Server className="h-8 w-8 text-red-600" />
      case 'checking': return <RefreshCw className="h-8 w-8 text-yellow-600 animate-spin" />
      default: return <AlertTriangle className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icône de statut */}
          <div className="mb-6">
            {getStatusIcon()}
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {status.isAvailable ? t('backend.connected') : t('backend.unavailable')}
          </h1>

          {/* Message de statut */}
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {status.message}
          </p>

          {/* Informations détaillées */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">{t('backend.connectionInfo')}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('status')} :</span>{' '}
                <span className={getStatusColor()}>{status.status}</span>
              </div>
              <div>
                <span className="font-medium">{t('backend.lastCheck')}</span>{' '}
                {status.lastCheck.toLocaleTimeString()}
              </div>
              {status.responseTime && (
                <div>
                  <span className="font-medium">{t('backend.responseTime')}</span>{' '}
                  {status.responseTime}ms
                </div>
              )}
              <div>
                <span className="font-medium">URL de l'API :</span>{' '}
                {process.env.NEXT_PUBLIC_API_URL || t('backend.notConfigured')}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {status.isAvailable ? (
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                {t('backend.accessDashboard')}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying || status.status === 'checking'}
                  className="w-full"
                >
                  {isRetrying || status.status === 'checking' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('backend.verifying')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('tryAgain')}
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-gray-500">
                  {t('backend.autoCheck')}
                </div>
              </>
            )}
          </div>

          {/* Conseils de dépannage */}
          {!status.isAvailable && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                {t('backend.troubleshooting')}
              </summary>
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p>• {t('backend.checkServer')}</p>
                <p>• {t('backend.checkPort', { port: process.env.NEXT_PUBLIC_API_URL?.split(':')[2]?.split('/')[0] || '3002' })}</p>
                <p>• {t('backend.checkNetwork')}</p>
                <p>• {t('backend.checkLogs')}</p>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}