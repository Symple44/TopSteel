/**
 * Page de gestion de l'apparence et des langues - TopSteel ERP
 * Version simplifiée: Thème + Langue uniquement
 */

'use client'

import React from 'react'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageContainer,
  PageHeader,
  PageSection,
} from '@erp/ui'
import { Globe, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppearanceSettings } from '../../../../hooks/use-appearance-settings'
import { useAuth } from '../../../../hooks/use-auth'
import { useToastShortcuts } from '../../../../hooks/use-toast'
import { useTranslation } from '../../../../lib/i18n/hooks'

export default function AppearanceSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('settings')
  const { success, error } = useToastShortcuts()

  // Hook pour gérer les préférences d'apparence
  const {
    settings,
    updateSetting,
    saveSettings,
    isLoading: settingsLoading,
    hasUnsavedChanges,
  } = useAppearanceSettings()

  // Vérifier l'authentification
  React?.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/settings/appearance')
    }
  }, [isAuthenticated, authLoading, router])

  // Sauvegarde automatique lorsque les paramètres changent
  React?.useEffect(() => {
    if (hasUnsavedChanges && !settingsLoading) {
      const timeoutId = setTimeout(async () => {
        try {
          await saveSettings()
          success(
            t('settingsEnhanced.appearance.messages.saveSuccess'),
            t('settingsEnhanced.appearance.messages.saveSuccessDesc')
          )
        } catch (_saveError) {
          error(
            t('settingsEnhanced.appearance.messages.saveError'),
            t('settingsEnhanced.appearance.messages.saveErrorDesc')
          )
        }
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [hasUnsavedChanges, saveSettings, success, error, settingsLoading, t])

  // Afficher un loader si pas encore authentifié ou si les paramètres chargent
  if (authLoading || !isAuthenticated || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('appearance.loading')}</p>
        </div>
      </div>
    )
  }

  // Thèmes simplifiés: Light, Dark, System (Vibrant retiré des options)
  const themes = [
    {
      id: 'light' as const,
      label: t('settingsEnhanced.appearance.themes.light'),
      icon: Sun,
      description: t('settingsEnhanced.appearance.themes.lightDesc'),
    },
    {
      id: 'dark' as const,
      label: t('settingsEnhanced.appearance.themes.dark'),
      icon: Moon,
      description: t('settingsEnhanced.appearance.themes.darkDesc'),
    },
    {
      id: 'system' as const,
      label: t('settingsEnhanced.appearance.themes.system'),
      icon: Monitor,
      description: t('settingsEnhanced.appearance.themes.systemDesc'),
    },
  ]

  // Langues traduites uniquement: FR, EN, ES
  const languages = [
    { id: 'fr', label: t('settingsEnhanced.appearance.languages.fr'), flag: '🇫🇷' },
    { id: 'en', label: t('settingsEnhanced.appearance.languages.en'), flag: '🇺🇸' },
    { id: 'es', label: t('settingsEnhanced.appearance.languages.es'), flag: '🇪🇸' },
  ]

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageHeader
        title={t('appearance.title')}
        description={t('appearance.subtitle')}
        icon={Palette}
        iconBackground="bg-gradient-to-br from-indigo-500 to-purple-600"
      />

      <PageSection spacing="default">
        <div className="space-y-8">
          {/* Thème */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Palette className="h-6 w-6 mr-3 text-primary" />
                {t('settingsEnhanced.appearance.sections.theme')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes?.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    type="button"
                    className={`w-full text-left p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      settings.theme === themeOption.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateSetting('theme', themeOption.id)}
                  >
                    <div className="flex items-center mb-2">
                      <themeOption.icon className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="font-medium text-foreground">{themeOption.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{themeOption.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Langue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Globe className="h-6 w-6 mr-3 text-primary" />
                {t('settingsEnhanced.appearance.sections.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {languages?.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`w-full p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                      settings.language === lang.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateSetting('language', lang.id)}
                  >
                    <div className="text-3xl mb-2">{lang.flag}</div>
                    <span className="text-sm font-medium text-foreground">{lang.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </PageContainer>
  )
}
