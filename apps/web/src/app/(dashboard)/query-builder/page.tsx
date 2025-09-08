'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'

export default function QueryBuilderPage() {
  const router = useRouter()
  const { t } = useTranslation('queryBuilder')

  useEffect(() => {
    router?.push('/query-builder/new')
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">{t('welcome')}</h2>
        <p className="text-muted-foreground">{t('selectOrCreate')}</p>
      </div>
    </div>
  )
}
