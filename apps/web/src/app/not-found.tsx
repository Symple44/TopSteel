/**
 * Page Not Found - TopSteel ERP
 * Fichier: apps/web/src/app/not-found.tsx
 */

'use client'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'

import { useTranslation } from '../lib/i18n/hooks'

export default function NotFound() {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">{t('pageNotFound')}</h2>
          <p className="max-w-md">{t('pageNotFoundMessage')}</p>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {t('backHome')}
          </a>

          <div className="text-sm">
            <a href="/dashboard" className="hover:underline">
              {t('dashboard')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
