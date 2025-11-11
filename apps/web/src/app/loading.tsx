/**
 * Page Loading - TopSteel ERP
 * Fichier: apps/web/src/app/loading.tsx
 */

'use client'

import { CompanyLogoWrapper } from '../components/wrappers/company-logo-wrapper'
import { useTranslation } from '../lib/i18n'

export default function Loading() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        {/* Logo de l'entreprise */}
        <div className="flex justify-center">
          <CompanyLogoWrapper size="lg" showCompanyName={true} className="mb-4" />
        </div>

        {/* Spinner et texte de chargement */}
        <div className="space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-lg font-medium">{t('common.loading')}</p>
        </div>
      </div>
    </div>
  )
}
