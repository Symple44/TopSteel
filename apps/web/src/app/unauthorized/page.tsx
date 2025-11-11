'use client'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'

import { Button } from '@erp/ui'
import { Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '../../lib/i18n/hooks'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <Shield className="mx-auto h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('unauthorizedTitle')}</h1>

        <p className="text-gray-600 mb-8">{t('unauthorizedMessage')}</p>

        <div className="space-y-4">
          <Button type="button" onClick={() => router?.push('/login')} className="w-full">
            {t('loginButton')}
          </Button>

          <Button type="button" onClick={() => router?.back()} variant="outline" className="w-full">
            {t('back')}
          </Button>
        </div>
      </div>
    </div>
  )
}
