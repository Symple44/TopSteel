/**
 * Page de gestion de l'apparence et des langues - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/appearance/page.tsx
 */

'use client'

import React from 'react'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import {
  ArrowLeft,
  Eye,
  Globe,
  Layout,
  Maximize,
  Monitor,
  Moon,
  Palette,
  Sun,
  Type,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TemplateSelector } from '@/components/settings/template-selector'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import { useAuth } from '@/hooks/use-auth'
import { useToastShortcuts } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/hooks'

export default function AppearanceSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { success, error } = useToastShortcuts()

  // Hook pour gérer les préférences d'apparence
  const {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading: settingsLoading,
    hasUnsavedChanges,
  } = useAppearanceSettings()

  // Vérifier l'authentification
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings/appearance')
    }
  }, [isAuthenticated, authLoading, router])

  // Sauvegarde automatique lorsque les paramètres changent
  React.useEffect(() => {
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
      }, 1000) // Attendre 1 seconde après le dernier changement

      return () => clearTimeout(timeoutId)
    }
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

  const _handleReset = () => {
    if (confirm(t('appearance.resetConfirm'))) {
      resetSettings()
    }
  }

  const themes = [
    {
      id: 'vibrant',
      label: t('settingsEnhanced.appearance.themes.vibrant'),
      icon: Palette,
      description: t('settingsEnhanced.appearance.themes.vibrantDesc'),
    },
    {
      id: 'light',
      label: t('settingsEnhanced.appearance.themes.light'),
      icon: Sun,
      description: t('settingsEnhanced.appearance.themes.lightDesc'),
    },
    {
      id: 'dark',
      label: t('settingsEnhanced.appearance.themes.dark'),
      icon: Moon,
      description: t('settingsEnhanced.appearance.themes.darkDesc'),
    },
    {
      id: 'system',
      label: t('settingsEnhanced.appearance.themes.system'),
      icon: Monitor,
      description: t('settingsEnhanced.appearance.themes.systemDesc'),
    },
  ]

  const languages = [
    { id: 'fr', label: t('settingsEnhanced.appearance.languages.fr'), flag: '🇫🇷' },
    { id: 'en', label: t('settingsEnhanced.appearance.languages.en'), flag: '🇺🇸' },
    { id: 'es', label: t('settingsEnhanced.appearance.languages.es'), flag: '🇪🇸' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ]

  const accentColors = [
    { id: 'blue', label: t('settingsEnhanced.appearance.accentColors.blue'), color: 'bg-blue-500' },
    {
      id: 'green',
      label: t('settingsEnhanced.appearance.accentColors.green'),
      color: 'bg-green-500',
    },
    {
      id: 'purple',
      label: t('settingsEnhanced.appearance.accentColors.purple'),
      color: 'bg-purple-500',
    },
    {
      id: 'orange',
      label: t('settingsEnhanced.appearance.accentColors.orange'),
      color: 'bg-orange-500',
    },
    { id: 'pink', label: t('settingsEnhanced.appearance.accentColors.pink'), color: 'bg-pink-500' },
    { id: 'red', label: t('settingsEnhanced.appearance.accentColors.red'), color: 'bg-red-500' },
    { id: 'teal', label: 'Sarcelle', color: 'bg-teal-500' },
    {
      id: 'indigo',
      label: t('settingsEnhanced.appearance.accentColors.indigo'),
      color: 'bg-indigo-500',
    },
    {
      id: 'yellow',
      label: t('settingsEnhanced.appearance.accentColors.yellow'),
      color: 'bg-yellow-500',
    },
    { id: 'emerald', label: 'Émeraude', color: 'bg-emerald-500' },
    { id: 'rose', label: 'Rose vif', color: 'bg-rose-500' },
    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('appearance.back')}
          </Button>

          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg mr-4">
              <Palette className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('appearance.title')}</h1>
              <p className="text-slate-600">{t('appearance.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Sélecteur de Templates */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-6">
              <TemplateSelector />
            </CardContent>
          </Card>

          {/* Thème */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Palette className="h-6 w-6 mr-3 text-indigo-600" />
                {t('settingsEnhanced.appearance.sections.theme')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    type="button"
                    className={`w-full text-left p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.theme === themeOption.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('theme', themeOption.id)}
                  >
                    <div className="flex items-center mb-2">
                      <themeOption.icon className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="font-medium text-slate-800">{themeOption.label}</span>
                    </div>
                    <p className="text-sm text-slate-600">{themeOption.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Langue */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Globe className="h-6 w-6 mr-3 text-blue-600" />
                {t('settingsEnhanced.appearance.sections.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`w-full p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      settings.language === lang.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('language', lang.id)}
                  >
                    <div className="text-2xl mb-1">{lang.flag}</div>
                    <span className="text-sm font-medium text-slate-800">{lang.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Couleur d'accent */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Eye className="h-6 w-6 mr-3 text-purple-600" />
                {t('settingsEnhanced.appearance.sections.accentColor')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`w-full p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      settings.accentColor === color.id
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('accentColor', color.id)}
                  >
                    <div className={`w-8 h-8 ${color.color} rounded-full mx-auto mb-1`}></div>
                    <span className="text-xs font-medium text-slate-800">{color.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Taille de police */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Type className="h-6 w-6 mr-3 text-green-600" />
                {t('settingsEnhanced.appearance.sections.fontSize')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: 'small',
                    label: t('settingsEnhanced.appearance.fontSizes.small'),
                    sample: 'text-sm',
                  },
                  {
                    id: 'medium',
                    label: t('settingsEnhanced.appearance.fontSizes.medium'),
                    sample: 'text-base',
                  },
                  {
                    id: 'large',
                    label: t('settingsEnhanced.appearance.fontSizes.large'),
                    sample: 'text-lg',
                  },
                ].map((size) => (
                  <label key={size.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="fontSize"
                      value={size.id}
                      checked={settings.fontSize === size.id}
                      onChange={(e) => updateSetting('fontSize', e.target.value as any)}
                      className="text-green-600"
                    />
                    <span className={`${size.sample} text-slate-800`}>
                      {size.label} - {tc('common.example')} de texte
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Densité d'affichage */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Layout className="h-6 w-6 mr-3 text-orange-600" />
                {t('settingsEnhanced.appearance.sections.density')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: 'compact',
                    label: t('settingsEnhanced.appearance.densities.compact'),
                    description: "Plus d'éléments visibles",
                  },
                  {
                    id: 'comfortable',
                    label: t('settingsEnhanced.appearance.densities.comfortable'),
                    description: 'Équilibre optimal',
                  },
                  {
                    id: 'spacious',
                    label: t('settingsEnhanced.appearance.densities.spacious'),
                    description: "Plus d'espace entre les éléments",
                  },
                ].map((densityOption) => (
                  <label
                    key={densityOption.id}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="density"
                      value={densityOption.id}
                      checked={settings.density === densityOption.id}
                      onChange={(e) => updateSetting('density', e.target.value as any)}
                      className="text-orange-600"
                    />
                    <div>
                      <div className="font-medium text-slate-800">{densityOption.label}</div>
                      <div className="text-sm text-slate-600">{densityOption.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Largeur du contenu */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Maximize className="h-6 w-6 mr-3 text-purple-600" />
                {t('settingsEnhanced.appearance.sections.contentWidth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: 'compact',
                    label: t('settingsEnhanced.appearance.contentWidths.narrow'),
                    description: 'Largeur limitée pour une meilleure lisibilité',
                  },
                  {
                    id: 'full',
                    label: t('settingsEnhanced.appearance.contentWidths.full'),
                    description: "Utilise toute la largeur de l'écran",
                  },
                ].map((widthOption) => (
                  <label
                    key={widthOption.id}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="contentWidth"
                      value={widthOption.id}
                      checked={settings.contentWidth === widthOption.id}
                      onChange={(e) => updateSetting('contentWidth', e.target.value as any)}
                      className="text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-slate-800">{widthOption.label}</div>
                      <div className="text-sm text-slate-600">{widthOption.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
