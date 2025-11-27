'use client'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'

import { Button } from '@erp/ui'
import { Home, LogIn, Mail, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/use-auth'
import { useTranslation } from '../../lib/i18n/hooks'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <Shield className="mx-auto h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('unauthorizedTitle')}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-4">{t('unauthorizedMessage')}</p>

        {/* Afficher le rôle actuel pour aider l'utilisateur à comprendre */}
        {isAuthenticated && user && (
          <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('connectedAs') || 'Connecté en tant que'}{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
            </p>
            {user.role && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('currentRole') || 'Rôle actuel'} :{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{user.role}</span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {/* Bouton principal : Dashboard (toujours accessible) */}
          <Button
            type="button"
            onClick={() => router?.push('/dashboard')}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            {t('goToDashboard') || 'Aller au tableau de bord'}
          </Button>

          {/* Si non authentifié, proposer la connexion */}
          {!isAuthenticated && (
            <Button
              type="button"
              onClick={() => router?.push('/login')}
              variant="outline"
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t('loginButton')}
            </Button>
          )}

          {/* Contacter l'admin si besoin d'accès */}
          <Button
            type="button"
            onClick={() => router?.push('/support')}
            variant="ghost"
            className="w-full text-gray-500"
          >
            <Mail className="mr-2 h-4 w-4" />
            {t('contactSupport') || 'Contacter le support'}
          </Button>
        </div>
      </div>
    </div>
  )
}
