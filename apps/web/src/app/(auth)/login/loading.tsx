'use client'

import { Building2 } from 'lucide-react'
import { CompanyLogoWrapper } from '../../../components/wrappers/company-logo-wrapper'
import { useTranslation } from '../../../lib/i18n'

// Composant de loading pendant l'hydratation client
export default function LoginLoading() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        {/* Logo de l'entreprise */}
        <div className="mb-6">
          <CompanyLogoWrapper
            size="lg"
            showCompanyName={true}
            fallback={
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            }
          />
        </div>

        <p className="text-muted-foreground mb-4">
          {t('auth.loading') || 'Chargement de la connexion...'}
        </p>

        <div className="inline-flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
