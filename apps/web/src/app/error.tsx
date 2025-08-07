'use client'

export const dynamic = 'force-dynamic'

import { useTranslation } from '@/lib/i18n/hooks'

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation('errors')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-destructive">{t('title')}</h1>
          <p className="text-muted-foreground max-w-md">{t('unexpected')}</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    </div>
  )
}
