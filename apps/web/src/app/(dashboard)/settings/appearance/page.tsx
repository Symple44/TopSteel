/**
 * Page de gestion de l'apparence et des langues - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/appearance/page.tsx
 */

'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/hooks'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import {
  Palette,
  Monitor,
  Moon,
  Sun,
  Globe,
  Type,
  Layout,
  Eye,
  ArrowLeft,
  Check,
  Maximize,
} from 'lucide-react'

export default function AppearanceSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  
  // Hook pour gérer les préférences d'apparence
  const {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading: settingsLoading,
    hasUnsavedChanges
  } = useAppearanceSettings()
  
  // Vérifier l'authentification
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings/appearance')
    }
  }, [isAuthenticated, authLoading, router])
  
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

  const handleSave = async () => {
    try {
      await saveSettings()
      alert(t('appearance.saveSuccess'))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(t('appearance.saveError'))
    }
  }

  const handleReset = () => {
    if (confirm(t('appearance.resetConfirm'))) {
      resetSettings()
    }
  }

  const themes = [
    { id: 'vibrant', label: 'Coloré', icon: Palette, description: 'Thème coloré moderne' },
    { id: 'light', label: 'Clair', icon: Sun, description: 'Interface claire' },
    { id: 'dark', label: 'Sombre', icon: Moon, description: 'Interface sombre' },
    { id: 'system', label: 'Système', icon: Monitor, description: 'Suit les paramètres système' }
  ]

  const languages = [
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ]

  const accentColors = [
    { id: 'blue', label: 'Bleu', color: 'bg-blue-500' },
    { id: 'green', label: 'Vert', color: 'bg-green-500' },
    { id: 'purple', label: 'Violet', color: 'bg-purple-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { id: 'pink', label: 'Rose', color: 'bg-pink-500' },
    { id: 'red', label: 'Rouge', color: 'bg-red-500' }
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
              <h1 className="text-3xl font-bold text-slate-900">
                {t('appearance.title')}
              </h1>
              <p className="text-slate-600">
                {t('appearance.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Thème */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Palette className="h-6 w-6 mr-3 text-indigo-600" />
                Thème
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes.map((themeOption) => (
                  <div
                    key={themeOption.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.theme === themeOption.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('theme', themeOption.id as any)}
                  >
                    <div className="flex items-center mb-2">
                      <themeOption.icon className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="font-medium text-slate-800">{themeOption.label}</span>
                    </div>
                    <p className="text-sm text-slate-600">{themeOption.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Langue */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Globe className="h-6 w-6 mr-3 text-blue-600" />
                Langue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      settings.language === lang.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('language', lang.id)}
                  >
                    <div className="text-2xl mb-1">{lang.flag}</div>
                    <span className="text-sm font-medium text-slate-800">{lang.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Couleur d'accent */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Eye className="h-6 w-6 mr-3 text-purple-600" />
                Couleur d'accent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {accentColors.map((color) => (
                  <div
                    key={color.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      settings.accentColor === color.id 
                        ? 'border-slate-400 bg-slate-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => updateSetting('accentColor', color.id as any)}
                  >
                    <div className={`w-8 h-8 ${color.color} rounded-full mx-auto mb-1`}></div>
                    <span className="text-xs font-medium text-slate-800">{color.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Taille de police */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Type className="h-6 w-6 mr-3 text-green-600" />
                Taille de police
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'small', label: 'Petite', sample: 'text-sm' },
                  { id: 'medium', label: 'Moyenne', sample: 'text-base' },
                  { id: 'large', label: 'Grande', sample: 'text-lg' }
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
                      {size.label} - Exemple de texte
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
                Densité d'affichage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'compact', label: 'Compacte', description: 'Plus d\'éléments visibles' },
                  { id: 'comfortable', label: 'Confortable', description: 'Équilibre optimal' },
                  { id: 'spacious', label: 'Espacée', description: 'Plus d\'espace entre les éléments' }
                ].map((densityOption) => (
                  <label key={densityOption.id} className="flex items-center space-x-3 cursor-pointer">
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
                Largeur du contenu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'compact', label: 'Compact', description: 'Largeur limitée pour une meilleure lisibilité' },
                  { id: 'full', label: 'Pleine largeur', description: 'Utilise toute la largeur de l\'écran' }
                ].map((widthOption) => (
                  <label key={widthOption.id} className="flex items-center space-x-3 cursor-pointer">
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

          {/* Boutons d'action */}
          <div className="flex justify-between pt-8">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="px-6 text-red-600 border-red-200 hover:bg-red-50"
            >
{t('appearance.reset')}
            </Button>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="px-8"
              >
                {t('appearance.back')}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 ${
                  !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Check className="h-4 w-4 mr-2" />
{hasUnsavedChanges ? t('appearance.save') : t('appearance.saved')}
              </Button>
            </div>
          </div>
          
          {/* Indicateur de changements non sauvegardés */}
          {hasUnsavedChanges && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                ⚠️ {t('appearance.unsavedChanges')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}