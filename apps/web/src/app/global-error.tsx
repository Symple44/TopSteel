'use client'
export const dynamic = 'force-dynamic'

import { useTranslation } from '../lib/i18n/hooks'
// import { Button } from '@erp/ui'
/**
 * Page Global Error - TopSteel ERP
 * Fichier: apps/web/src/app/global-error.tsx
 */

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, language } = useTranslation('errors')

  return (
    <html lang={language || 'fr'}>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-destructive">{t('title')}</h1>
              <h2 className="text-2xl font-semibold">{t('general')}</h2>
              <p className="text-muted-foreground max-w-md">{t('unexpectedDetailed')}</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t('tryAgain')}
              </button>

              <div className="text-sm text-muted-foreground">
                <a href="/dashboard" className="hover:text-foreground transition-colors">
                  {t('backHome')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
